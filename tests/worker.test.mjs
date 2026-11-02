import { createRequire } from "node:module";
import { readFile, readdir } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.resolve("wrangler"));
const { Miniflare } = require("miniflare");
const files = await readdir("dist/server", { recursive: true });
const modules = [
  "index.js",
  ...files.filter((f) => f !== "index.js" && /\.m?js$/.test(f)),
].map((f) => ({ type: "ESModule", path: process.cwd() + "/dist/server/" + f }));
const mf = new Miniflare({
  modules,
  modulesRoot: process.cwd() + "/dist/server",
  compatibilityDate: "2026-05-15",
  compatibilityFlags: ["nodejs_compat"],
  d1Databases: ["DB"],
  r2Buckets: ["BUCKET"],
});
try {
  const db = await mf.getD1Database("DB");
  const sql = await readFile("drizzle/0000_high_praxagora.sql", "utf8");
  for (const stmt of sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean))
    await db.prepare(stmt).run();
  const origin = "https://test.local";
  const userA = {
    "oai-authenticated-user-id": "test-owner-a",
    "oai-authenticated-user-email": "a@example.test",
    Origin: origin,
    "Content-Type": "application/json",
  };
  const userB = {
    ...userA,
    "oai-authenticated-user-id": "test-owner-b",
    "oai-authenticated-user-email": "b@example.test",
  };
  async function request(path, options = {}) {
    const r = await mf.dispatchFetch(origin + path, options);
    const text = await r.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`Non JSON: ${r.status} ${text.slice(0, 200)}`);
    }
    return { status: r.status, body };
  }
  let r = await request("/api/catalog?bar=demo");
  assert.equal(r.status, 200);
  assert.equal(r.body.bar.products.length, 16);
  console.log("PASS public example catalog");
  r = await request("/api/bootstrap", { method: "POST" });
  assert.equal(r.status, 401);
  console.log("PASS anonymous create rejected");
  r = await request("/api/bootstrap", { method: "POST", headers: userA });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  let a = r.body.bar;
  assert.ok(a.id !== "demo");
  console.log("PASS owner A provisions durable catalog");
  r = await request("/api/bootstrap", { method: "POST", headers: userB });
  assert.equal(r.status, 200);
  let b = r.body.bar;
  assert.notEqual(a.id, b.id);
  console.log("PASS owners have separate menus");
  a.name = "Test Venue A";
  a.demo = false;
  a.whatsappNumber = "18323165870";
  a.tableCount = 24;
  a.products[0].ingredients = "Ingredientes de prueba actualizados";
  a.products[0].available = false;
  r = await request("/api/catalog", {
    method: "PUT",
    headers: userA,
    body: JSON.stringify(a),
  });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  let saved = r.body.bar;
  assert.equal(saved.revision, 2);
  console.log("PASS authorized catalog save");
  r = await request("/api/catalog", {
    method: "PUT",
    headers: userB,
    body: JSON.stringify(saved),
  });
  assert.equal(r.status, 403);
  console.log("PASS cross-owner write rejected");
  r = await request("/api/catalog", {
    method: "PUT",
    headers: userA,
    body: JSON.stringify(a),
  });
  assert.equal(r.status, 409);
  console.log("PASS stale revision write rejected");
  r = await request("/api/catalog?bar=" + saved.slug);
  assert.equal(r.status, 200);
  assert.equal(r.body.bar.name, "Test Venue A");
  assert.equal(r.body.bar.notes, undefined);
  assert.equal(r.body.bar.whatsappNumber, "18323165870");
  assert.equal(r.body.bar.tableCount, 24);
  assert.equal(r.body.bar.products[0].ingredients, "Ingredientes de prueba actualizados");
  assert.equal(r.body.bar.products[0].available, false);
  console.log("PASS admin ingredients, availability, phone and tables reach the public menu");
  console.log("PASS public catalog exposes saved data without internal notes");
  r = await request("/api/events", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({
      bar: saved.slug,
      kind: "flip",
      productId: saved.products[0].id,
    }),
  });
  assert.equal(r.status, 200);
  r = await request("/api/events", { headers: userA });
  assert.equal(r.status, 200);
  assert.ok(r.body.events.some((e) => e.kind === "flip" && e.count === 1));
  r = await request("/api/events", { headers: userB });
  assert.equal(r.body.events.length, 0);
  console.log("PASS analytics persisted and owner-scoped");
  r = await request("/api/chat", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({
      bar: saved.slug,
      message: "Soy alérgico al maní",
      lang: "es",
    }),
  });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.ids, []);
  console.log("PASS allergy response excludes suggestions");
  r = await request("/api/catalog", {
    method: "PUT",
    headers: { ...userA, Origin: "https://attacker.test" },
    body: JSON.stringify(saved),
  });
  assert.equal(r.status, 400);
  console.log("PASS foreign-origin write rejected");
  r = await request("/api/translate", {
    method: "POST",
    headers: userA,
    body: JSON.stringify({
      name: "Prueba",
      description: "",
      ingredients: "",
      preparation: "",
    }),
  });
  assert.equal(r.status, 503);
  console.log("PASS missing AI configuration reported honestly");
  const file = new File(
      [await readFile("public/images/beer.jpg")],
      "test.jpg",
      { type: "image/jpeg" },
    ),
    form = new FormData();
  form.append("file", file);
  const encoded = new Request(origin + "/api/upload", {
    method: "POST",
    body: form,
  });
  r = await request("/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": encoded.headers.get("content-type"),
      "oai-authenticated-user-id": userA["oai-authenticated-user-id"],
      "oai-authenticated-user-email": userA["oai-authenticated-user-email"],
      Origin: origin,
    },
    body: new Uint8Array(await encoded.arrayBuffer()),
  });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const media = await mf.dispatchFetch(origin + r.body.url);
  assert.equal(media.status, 200);
  assert.equal(media.headers.get("content-type"), "image/jpeg");
  console.log("PASS authenticated R2 upload and media retrieval");
  r = await request("/api/manifest?bar=" + saved.slug);
  assert.equal(r.status, 200);
  assert.equal(r.body.start_url, "/b/" + saved.slug);
  assert.equal(r.body.name, "Test Venue A · Menú");
  console.log("PASS installed PWA opens the correct venue");
  const craft = await request("/api/catalog?bar=crafted");
  assert.equal(craft.status, 200);
  assert.equal(craft.body.bar.baseCurrency, "USD");
  assert.ok(craft.body.bar.products.length >= 122);
  console.log("PASS Crafted import uses USD and complete priced catalog");
  console.log("ALL WORKER INTEGRATION CHECKS PASSED");
} finally {
  await mf.dispose();
}
