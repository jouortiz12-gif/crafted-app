import { env } from "cloudflare:workers";
export async function GET(
  r: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  if (!/^[a-zA-Z0-9.-]+$/.test(key)) return new Response(null, { status: 400 });
  const requestedRange = r.headers.get("range");
  const object = await env.BUCKET?.get(
    key,
    requestedRange ? { range: r.headers } : {},
  );
  if (!object) return new Response(null, { status: 404 });
  const h = new Headers();
  object.writeHttpMetadata(h);
  h.set("ETag", object.httpEtag);
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Cache-Control", "public,max-age=86400");
  h.set("Accept-Ranges", "bytes");
  h.set("Content-Length", String(object.size));
  let status = 200;
  if (requestedRange && object.range && "offset" in object.range) {
    const offset = object.range.offset || 0;
    const length = object.range.length || object.size;
    h.set(
      "Content-Range",
      `bytes ${offset}-${offset + length - 1}/${object.size}`,
    );
    h.set("Content-Length", String(length));
    status = 206;
  }
  return new Response(object.body, { headers: h, status });
}
