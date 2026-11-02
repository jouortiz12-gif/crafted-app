import { env } from "cloudflare:workers";
export async function cloudUpload(file: File, barId: string) {
  const config = env;
  const cloud = config.CLOUDINARY_CLOUD_NAME,
    key = config.CLOUDINARY_API_KEY,
    secret = config.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(cloud))
    throw new Error("Configuración multimedia inválida");
  const timestamp = Math.floor(Date.now() / 1000).toString(),
    folder = `barra/${barId}`;
  const signatureBytes = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(
      `folder=${folder}&timestamp=${timestamp}${secret}`,
    ),
  );
  const signature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const data = new FormData();
  data.append("file", file);
  data.append("folder", folder);
  data.append("timestamp", timestamp);
  data.append("signature", signature);
  data.append("api_key", key);
  const resource = file.type.startsWith("video/") ? "video" : "image";
  const r = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud}/${resource}/upload`,
    { method: "POST", body: data, signal: AbortSignal.timeout(45000) },
  );
  if (!r.ok)
    throw new Error("El servicio multimedia no pudo recibir el archivo");
  const d: any = await r.json();
  if (
    typeof d.secure_url !== "string" ||
    !d.secure_url.startsWith("https://res.cloudinary.com/")
  )
    throw new Error("Archivo multimedia inválido");
  return d.secure_url.replace(
    "/upload/",
    resource === "video"
      ? "/upload/c_limit,w_720,q_auto,f_auto/"
      : "/upload/c_limit,w_1600,q_auto,f_auto/",
  );
}
export { validSignature } from "./media-validation";
