export function tableFromSearch(search: string) {
  const value = new URLSearchParams(search).get("mesa");
  return value && /^[1-9]\d{0,2}$/.test(value) ? value : "";
}
export function tableMenuUrl(menuUrl: string, table: number) {
  if (!Number.isInteger(table) || table < 1 || table > 999)
    throw new Error("Mesa inválida");
  const url = new URL(menuUrl);
  if (!["https:", "http:"].includes(url.protocol))
    throw new Error("Enlace inválido");
  url.searchParams.set("mesa", String(table));
  url.hash = "";
  return url.toString();
}
