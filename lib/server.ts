import { crafted } from "./crafted";
import { barSchema } from "./validation";
import { withRates } from "./rates";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../app/chatgpt-auth";
import { demo } from "./seed";
import { safeAccent } from "./menu";
import { z } from "zod";
import type { Bar } from "./types";
export function db() {
  if (!env.DB) throw new Error("Base de datos no disponible");
  return env.DB;
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export function originGuard(r: Request) {
  const o = r.headers.get("origin");
  if (o && o !== new URL(r.url).origin) throw new Error("Origen no permitido");
}
export async function readBody(r: Request) {
  const s = await r.text();
  if (s.length > 700000) throw new Error("Contenido demasiado grande");
  return JSON.parse(s);
}
export async function owner() {
  const u = await getChatGPTUser();
  if (!u) throw new Error("AUTH");
  return u;
}
export async function ownedBar() {
  const u = await owner();
  const row = await db()
    .prepare("SELECT * FROM bars WHERE owner_id=?")
    .bind(u.userId)
    .first<{ id: string; data: string; revision: number }>();
  if (!row) throw new Error("Crea tu menú primero");
  return {
    u,
    row,
    bar: { ...JSON.parse(row.data), revision: row.revision } as Bar,
  };
}
export async function publicBar(slug: string, internal = false) {
  if (!slug || slug === "demo") return structuredClone(demo);
  const row = await db()
    .prepare("SELECT data,revision FROM bars WHERE slug=?")
    .bind(slug)
    .first<{ data: string; revision: number }>();
  if (!row) {
    if (slug === "crafted") {
      const b = structuredClone(crafted);
      if (!internal) delete (b as any).notes;
      return withRates(b);
    }
    return null;
  }
  const b = { ...JSON.parse(row.data), revision: row.revision };
  if (!internal) delete b.notes;
  return withRates(b as Bar);
}
export async function provision() {
  const u = await owner();
  const existing = await db()
    .prepare("SELECT data,revision FROM bars WHERE owner_id=?")
    .bind(u.userId)
    .first<{ data: string; revision: number }>();
  if (existing)
    return { ...JSON.parse(existing.data), revision: existing.revision };
  const id = crypto.randomUUID();
  const b = {
    ...structuredClone(crafted),
    id,
    slug: "crafted",
  };
  await db()
    .prepare(
      "INSERT OR IGNORE INTO bars (id,owner_id,slug,data,revision,updated_at) VALUES (?,?,?,?,1,?)",
    )
    .bind(id, u.userId, b.slug, JSON.stringify(b), Date.now())
    .run();
  const saved = await db()
    .prepare("SELECT id FROM bars WHERE owner_id=?")
    .bind(u.userId)
    .first();
  if (!saved) {
    b.slug = `crafted-${id.slice(0, 8)}`;
    await db()
      .prepare(
        "INSERT INTO bars (id,owner_id,slug,data,revision,updated_at) VALUES (?,?,?,?,1,?)",
      )
      .bind(id, u.userId, b.slug, JSON.stringify(b), Date.now())
      .run();
  }
  return (await ownedBar()).bar;
}
export function error(e: unknown) {
  const msg = e instanceof Error ? e.message : "Error inesperado";
  if (msg === "AUTH")
    return json({ error: "Inicia sesión para administrar tu menú." }, 401);
  if (e instanceof z.ZodError)
    return json({ error: e.issues[0]?.message || "Datos inválidos" }, 400);
  console.error("API error", msg);
  return json(
    {
      error:
        msg === "Origen no permitido"
          ? msg
          : "No se pudo completar. Revisa los datos e inténtalo de nuevo.",
    },
    400,
  );
}
export async function save(r: Request) {
  originGuard(r);
  const { row, bar } = await ownedBar();
  const parsed = barSchema.parse(await readBody(r));
  if (parsed.id !== bar.id) return json({ error: "Menú no autorizado" }, 403);
  parsed.accent = safeAccent(parsed.accent);
  const b = { ...parsed, revision: parsed.revision + 1 };
  try {
    const result = await db()
      .prepare(
        "UPDATE bars SET slug=?,data=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?",
      )
      .bind(b.slug, JSON.stringify(b), Date.now(), row.id, parsed.revision)
      .run();
    if (result.meta.changes === 0)
      return json(
        {
          error:
            "El menú cambió en otro dispositivo. Recarga antes de guardar.",
        },
        409,
      );
  } catch {
    return json({ error: "Ese enlace ya existe. Elige otro nombre." }, 409);
  }
  return json({ bar: b });
}
export async function aiJSON(system: string, input: string) {
  const key = env.GEMINI_API_KEY;
  if (!key) return null;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL || "gemini-2.5-flash"}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: input }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
      signal: AbortSignal.timeout(18000),
    },
  );
  if (!response.ok) throw new Error("Servicio de IA no disponible");
  const data: any = await response.json();
  return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
}
