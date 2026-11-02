import { json, error, publicBar, save, db } from "../../../lib/server";
export async function GET(r: Request) {
  try {
    const params = new URL(r.url).searchParams,
      slug = params.get("bar") || "demo";
    if (slug !== "demo" && slug !== "crafted" && params.has("revision")) {
      const row = await db()
        .prepare("SELECT revision FROM bars WHERE slug=?")
        .bind(slug)
        .first<{ revision: number }>();
      if (row && row.revision === Number(params.get("revision")))
        return new Response(null, {
          status: 204,
          headers: { "Cache-Control": "no-store" },
        });
    }
    const bar = await publicBar(slug);
    return bar ? json({ bar }) : json({ error: "Menú no encontrado" }, 404);
  } catch (e) {
    return error(e);
  }
}
export async function PUT(r: Request) {
  try {
    return await save(r);
  } catch (e) {
    return error(e);
  }
}
