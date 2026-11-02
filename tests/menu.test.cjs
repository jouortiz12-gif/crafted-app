const { test } = require("node:test");
const assert = require("node:assert/strict");
const { demo } = require("../.sites-runtime/test-build/seed.js");
const { barSchema } = require("../.sites-runtime/test-build/validation.js");
const {
  recommend,
  money,
  safeAccent,
  localProduct,
  displaySize,
} = require("../.sites-runtime/test-build/menu.js");
const {
  validSignature,
} = require("../.sites-runtime/test-build/media-validation.js");
const bar = () => ({
  ...structuredClone(demo),
  id: "venue-test",
  slug: "test-bar",
});
test("catalog has all eight categories and valid pairing references", () => {
  const b = bar();
  assert.equal(b.categories.length, 8);
  assert.equal(b.products.length, 16);
  assert.ok(barSchema.safeParse(b).success);
});
test("prices convert from MXN using the selected configured rate", () => {
  const b = bar();
  b.rates.USD = 0.05;
  assert.equal(money(100, "MXN", b), "$100");
  assert.match(money(100, "USD", b), /5\.00/);
  assert.match(money(100, "EUR", b), /4\.60/);
});
test("invalid rates and negative prices cannot be saved", () => {
  const b = bar();
  b.rates.USD = 0;
  assert.equal(barSchema.safeParse(b).success, false);
  b.rates.USD = 0.05;
  b.products[0].price = -1;
  assert.equal(barSchema.safeParse(b).success, false);
});
test("duplicate product IDs, dangling categories and pairings are rejected", () => {
  const b = bar();
  b.products[1].id = b.products[0].id;
  assert.equal(barSchema.safeParse(b).success, false);
  const c = bar();
  c.products[0].pairing = "missing";
  assert.equal(barSchema.safeParse(c).success, false);
  c.products[0].pairing = "";
  c.products[0].category = "missing";
  assert.equal(barSchema.safeParse(c).success, false);
});
test("unsafe media schemes and reserved slugs are rejected", () => {
  const b = bar();
  b.logo = "javascript:alert(1)";
  assert.equal(barSchema.safeParse(b).success, false);
  b.logo = "";
  b.slug = "admin";
  assert.equal(barSchema.safeParse(b).success, false);
});
test("all sample products have complete translations in four target languages", () => {
  for (const p of demo.products)
    for (const l of ["en", "fr", "zh", "ru"])
      for (const key of ["name", "description", "ingredients", "preparation"])
        assert.ok(p.translations[l][key], `${p.id} ${l} ${key}`);
});
test("language fallback preserves original ingredient facts", () => {
  const p = structuredClone(demo.products[0]);
  p.translations.fr.ingredients = "";
  assert.equal(localProduct(p, "fr").ingredients, p.ingredients);
  assert.equal(displaySize("3 piezas", "en"), "3 pieces");
});
test("allergy query returns no safety recommendation", () => {
  const result = recommend(
    bar(),
    "Soy alérgico al maní, ¿qué postre es seguro?",
  );
  assert.equal(result.allergy, true);
  assert.deepEqual(result.ids, []);
});
test("low-bitterness beer recommendations obey IBU and availability", () => {
  const b = bar();
  b.products.find((p) => p.id === "sour").available = false;
  const r = recommend(b, "Quiero una cerveza poco amarga");
  assert.ok(r.ids.length > 0);
  for (const id of r.ids) {
    const p = b.products.find((p) => p.id === id);
    assert.ok(
      p.ibu <= 20 && p.available && ["tap", "bottle"].includes(p.category),
    );
  }
});
test("alcohol-free query never includes alcohol", () => {
  const b = bar();
  for (const id of recommend(b, "Algo sin alcohol").ids)
    assert.equal(b.products.find((p) => p.id === id).abv, 0);
});
test("underage query never recommends an alcoholic product", () => {
  const b = bar();
  for (const id of recommend(b, "Tengo 16 años y quiero cerveza").ids)
    assert.equal(b.products.find((p) => p.id === id).abv, 0);
});
test("sharing plan stays under the full budget, rather than per-product budget", () => {
  const b = bar(),
    r = recommend(b, "Para compartir entre 4 amigos con menos de $800 pesos");
  assert.ok(r.plan);
  assert.equal(r.plan.people, 4);
  assert.ok(r.ids.length > 0);
  const total = r.ids.reduce(
    (n, id) => n + b.products.find((p) => p.id === id).price,
    0,
  );
  assert.equal(r.plan.totalMXN, total);
  assert.ok(total <= 800);
});
test("budget with no eligible product returns no fabricated item", () => {
  const r = recommend(bar(), "Comida por menos de $1");
  assert.deepEqual(r.ids, []);
});
test("named ingredient query retrieves the corresponding real product", () => {
  assert.deepEqual(
    recommend(bar(), "¿Qué ingredientes lleva la hamburguesa?").ids,
    ["burger"],
  );
});
test("contrast adjustment passes AA against menu background", () => {
  function lum(hex) {
    return hex
      .slice(1)
      .match(/../g)
      .map((x) => parseInt(x, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  }
  for (const c of [
    "#000000",
    "#222222",
    "#0000ff",
    "#ee0000",
    "#00ff00",
    "#e9b56b",
  ])
    assert.ok((lum(safeAccent(c)) + 0.05) / (lum("#101112") + 0.05) >= 4.5);
});
test("upload signature validation rejects MIME spoofing", async () => {
  assert.equal(
    await validSignature(
      new File(["<html>bad</html>"], "bad.jpg", { type: "image/jpeg" }),
    ),
    false,
  );
  assert.equal(
    await validSignature(
      new File([new Uint8Array([255, 216, 255, 224, 1, 2, 3])], "good.jpg", {
        type: "image/jpeg",
      }),
    ),
    true,
  );
});

const crafted = require("../lib/crafted-data.json");
test("Crafted USD price remains exact, MXN/EUR are converted references", () => {
  assert.equal(money(11.5, "USD", crafted), "$11.50");
  assert.equal(
    money(11.5, "MXN", crafted),
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
    }).format(11.5 * crafted.rates.MXN),
  );
});
test("Crafted import preserves variants and does not invent IBU or popular rankings", () => {
  assert.ok(barSchema.safeParse(crafted).success);
  assert.equal(crafted.products.length, 123);
  for (const p of crafted.products) {
    assert.equal(p.ibuKnown, false);
    assert.equal(p.popular, false);
    if (p.priceKnown !== false) assert.equal(p.price, p.options[0].price);
  }
  const michelob = crafted.products.find((p) => p.name === "Michelob Ultra");
  assert.deepEqual(
    michelob.options.map((o) => o.price),
    [5, 9, 12],
  );
});
test("Crafted recommendations do not offer supplements as meals or guess unknown bitterness", () => {
  for (const id of recommend(crafted, "food under $20").ids)
    assert.equal(crafted.products.find((p) => p.id === id).family, "food");
  assert.deepEqual(recommend(crafted, "a beer with low bitterness").ids, []);
});

const {
  orderItems,
  orderTotal,
  changeQuantity,
  orderMessage,
  whatsappLink,
} = require("../.sites-runtime/test-build/order.js");
test("order keeps quantities separate for different serving sizes", () => {
  const p = crafted.products.find((p) => p.name === "Michelob Ultra");
  let lines = changeQuantity([], p.id, 0, 1);
  lines = changeQuantity(lines, p.id, 0, 1);
  lines = changeQuantity(lines, p.id, 1, 1);
  assert.equal(orderTotal(lines, crafted), 19);
  assert.equal(orderItems(lines, crafted, "es").length, 2);
  lines = changeQuantity(lines, p.id, 0, -1);
  assert.equal(orderTotal(lines, crafted), 14);
  lines = changeQuantity(lines, p.id, 0, -1);
  assert.equal(lines.length, 1);
});
test("order filters unavailable products, invalid variants and invalid quantities", () => {
  const b = structuredClone(crafted),
    p = b.products[0];
  p.available = false;
  assert.deepEqual(
    orderItems([{ id: p.id, option: 0, quantity: 1 }], b, "es"),
    [],
  );
  assert.deepEqual(
    orderItems(
      [
        { id: b.products[1].id, option: 999, quantity: 1 },
        { id: b.products[1].id, option: 0, quantity: -1 },
        null,
      ],
      b,
      "es",
    ),
    [],
  );
});
test("WhatsApp draft contains complete quantities, serving sizes, subtotal, table and notes", () => {
  const p = crafted.products.find((p) => p.name === "Michelob Ultra");
  const msg = orderMessage(
    [{ id: p.id, option: 1, quantity: 2 }],
    crafted,
    "es",
    "4",
    "Sin hielo & gracias",
  );
  assert.ok(msg.includes("2 × Michelob Ultra · Liter"));
  assert.ok(msg.includes("$18.00 USD"));
  assert.ok(msg.includes("Mesa: 4"));
  assert.ok(msg.includes("Sin hielo & gracias"));
  const link = whatsappLink(crafted.whatsappNumber, msg);
  const url = new URL(link);
  assert.equal(url.pathname, "/18323165870");
  assert.equal(url.searchParams.get("text"), msg);
});
test("WhatsApp requires a valid configured destination and never auto-sends", () => {
  assert.equal(whatsappLink(undefined, "Prueba"), null);
  assert.equal(whatsappLink("123", "Prueba"), null);
  assert.equal(whatsappLink("https://attacker.test", "Prueba"), null);
  assert.equal(
    new URL(whatsappLink("+525538601646", "Prueba")).hostname,
    "wa.me",
  );
});
test("order arithmetic stays accurate at cents and quantity has a safe bound", () => {
  const p = crafted.products.find((p) => p.name === "Fountain Sodas");
  assert.equal(
    orderTotal([{ id: p.id, option: 0, quantity: 3 }], crafted),
    8.67,
  );
  assert.equal(
    changeQuantity([{ id: p.id, option: 0, quantity: 99 }], p.id, 0, 1)[0]
      .quantity,
    99,
  );
});
test("every Crafted description has localized content in all five supported languages", () => {
  for (const p of crafted.products) {
    for (const lang of ["es", "en", "fr", "zh", "ru"])
      assert.ok(localProduct(p, lang).description);
    for (const lang of ["es", "fr", "zh", "ru"]) {
      const d = localProduct(p, lang).description;
      assert.ok(!d.includes("Please ask"));
      assert.ok(!d.includes("Tortilla chips or"));
    }
  }
  const p = crafted.products.find((p) => p.name === "Chips & Dips (V, GF)");
  assert.match(localProduct(p, "es").description, /Totopos/);
  assert.match(localProduct(p, "fr").description, /tortilla/);
  assert.match(localProduct(p, "zh").description, /玉米/);
  assert.match(localProduct(p, "ru").description, /Кукуруз/);
});

const { tableFromSearch, tableMenuUrl } = require("../.sites-runtime/test-build/tables.js");
test("table QR links use one menu, preserving the venue and assigning each table", () => {
  const one = tableMenuUrl("https://example.test/b/crafted", 1);
  const two = tableMenuUrl("https://example.test/b/crafted", 2);
  assert.equal(new URL(one).pathname, new URL(two).pathname);
  assert.equal(tableFromSearch(new URL(two).search), "2");
  for (const q of ["?mesa=0", "?mesa=-1", "?mesa=1000", "?mesa=<script>", "?mesa=2.5"]) assert.equal(tableFromSearch(q), "");
  assert.throws(() => tableMenuUrl("https://example.test", 0));
  assert.throws(() => tableMenuUrl("javascript:alert(1)", 1));
});
test("customer identity and order items have blank lines for readable WhatsApp messages", () => {
  const p = crafted.products[0], q = crafted.products[1];
  const msg = orderMessage([{ id: p.id, option: 0, quantity: 2 }, { id: q.id, option: 0, quantity: 1 }], crafted, "es", "7", "Sin cebolla", "Ana Pérez");
  assert.match(msg, /Cliente: Ana Pérez\nMesa: 7\n\n/);
  assert.match(msg, /USD\n\n1 ×/);
  assert.match(msg, /\n\n\*Subtotal:/);
  const url = new URL(whatsappLink(crafted.whatsappNumber, msg));
  assert.equal(url.pathname, "/18323165870");
  assert.equal(url.searchParams.get("text"), msg);
});
test("table count is bounded and saved with business contact configuration", () => {
  const b = bar(); b.tableCount = 12; b.whatsappNumber = "18323165870";
  assert.ok(barSchema.safeParse(b).success);
  b.tableCount = 101; assert.equal(barSchema.safeParse(b).success, false);
});
