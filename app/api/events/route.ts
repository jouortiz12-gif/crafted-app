import {
  db,
  json,
  error,
  originGuard,
  readBody,
  ownedBar,
  publicBar,
} from "../../../lib/server";
export async function POST(r: Request) {
  try {
    originGuard(r);
    const { bar: slug, kind, productId, value } = await readBody(r);
    if (
      !["view", "flip", "chat", "language", "currency", "topic"].includes(kind)
    )
      return json({ error: "Evento inválido" }, 400);
    const bar = await publicBar(String(slug));
    if (!bar || ["demo", "crafted"].includes(bar.id)) return json({ ok: true });
    if (productId && !bar.products.some((p) => p.id === productId))
      return json({ error: "Producto inválido" }, 400);
    if (typeof value === "string" && value.length > 100)
      return json({ error: "Valor inválido" }, 400);
    const day = new Date().toISOString().slice(0, 10);
    const recent = await db()
      .prepare(
        "SELECT COUNT(*) as n FROM events WHERE bar_id=? AND created_at>?",
      )
      .bind(bar.id, Date.now() - 60000)
      .first<{ n: number }>();
    if ((recent?.n || 0) > 1000) return json({ ok: true, limited: true });
    const ip = r.headers.get("cf-connecting-ip") || "unknown";
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`${ip}:${day}:${bar.id}`),
    );
    const hash = Array.from(new Uint8Array(digest))
      .slice(0, 12)
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("");
    const id =
      kind === "view"
        ? `${bar.id}:${day}:${hash}:${productId}`
        : kind === "chat"
          ? `${bar.id}:${day}:${hash}:chat:${Math.floor(Date.now() / 10000)}`
          : crypto.randomUUID();
    await db()
      .prepare(
        "INSERT OR IGNORE INTO events (id,bar_id,kind,product_id,value,day,created_at) VALUES (?,?,?,?,?,?,?)",
      )
      .bind(
        id,
        bar.id,
        kind,
        productId || null,
        String(value || "").slice(0, 100),
        day,
        Date.now(),
      )
      .run();
    return json({ ok: true });
  } catch (e) {
    return error(e);
  }
}
export async function GET() {
  try {
    const { bar } = await ownedBar();
    const since = new Date(Date.now() - 30 * 86400000)
      .toISOString()
      .slice(0, 10);
    const result = await db()
      .prepare(
        "SELECT kind,product_id as productId,value,COUNT(*) as count FROM events WHERE bar_id=? AND day>=? GROUP BY kind,product_id,value ORDER BY count DESC LIMIT 200",
      )
      .bind(bar.id, since)
      .all();
    return json({ events: result.results, since });
  } catch (e) {
    return error(e);
  }
}
