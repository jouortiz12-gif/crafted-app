import { cloudUpload, validSignature } from "../../../lib/media";
import { env } from "cloudflare:workers";
import { json, error, originGuard, ownedBar } from "../../../lib/server";
export async function POST(r: Request) {
  try {
    originGuard(r);
    const { bar } = await ownedBar();
    const length = Number(r.headers.get("content-length") || 0);
    if (length > 16 * 1024 * 1024) return json({ error: "Máximo 15 MB." }, 413);
    const form = await r.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return json({ error: "Selecciona un archivo." }, 400);
    const types: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "video/mp4": "mp4",
      "video/webm": "webm",
    };
    if (!types[file.type] || file.size > 15 * 1024 * 1024)
      return json(
        { error: "Usa JPG, PNG, WEBP, MP4 o WEBM de hasta 15 MB." },
        400,
      );
    if (!(await validSignature(file)))
      return json(
        { error: "El archivo no corresponde al formato indicado." },
        400,
      );
    const cloud = await cloudUpload(file, bar.id);
    if (cloud) return json({ url: cloud, optimized: true });
    if (!env.BUCKET) throw new Error("Almacenamiento no disponible");
    const key = `${bar.id}-${crypto.randomUUID()}.${types[file.type]}`;
    await env.BUCKET.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
    return json({ url: `/api/media/${key}` });
  } catch (e) {
    return error(e);
  }
}
