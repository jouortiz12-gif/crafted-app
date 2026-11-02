export async function validSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  if (file.type === "image/jpeg")
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (file.type === "image/png")
    return [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  const str = new TextDecoder().decode(bytes);
  if (file.type === "image/webp")
    return str.startsWith("RIFF") && str.slice(8, 12) === "WEBP";
  if (file.type === "video/mp4") return str.slice(4, 8) === "ftyp";
  if (file.type === "video/webm")
    return (
      bytes[0] === 26 && bytes[1] === 69 && bytes[2] === 223 && bytes[3] === 163
    );
  return false;
}
