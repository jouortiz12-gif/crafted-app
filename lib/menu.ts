import craftedTranslations from "./crafted-translations.json";
import type { Bar, Product, Lang } from "./types";
export const langs: Lang[] = ["es", "en", "fr", "zh", "ru"];
export function safeAccent(hex: string) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return "#e9b56b";
  let rgb = hex
    .slice(1)
    .match(/../g)!
    .map((x) => parseInt(x, 16));
  const lum = (a: number[]) =>
    a
      .map((v) => v / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  while ((lum(rgb) + 0.05) / (0.006 + 0.05) < 4.5 && rgb.some((x) => x < 255))
    rgb = rgb.map((x) => Math.min(255, x + 8));
  return "#" + rgb.map((x) => x.toString(16).padStart(2, "0")).join("");
}
export function money(value: number, currency: string, bar: Bar) {
  const rate =
    currency === (bar.baseCurrency || "MXN")
      ? 1
      : (bar.rates as Record<string, number>)[currency];
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: currency === "MXN" ? 0 : 2,
  }).format(value * rate);
}
export function localProduct(p: Product, lang: Lang) {
  const entry = (craftedTranslations as any)[p.id];
  const fallback =
    entry &&
    entry.sourceName === p.name &&
    entry.sourceDescription === p.description
      ? entry.translations[lang]
      : undefined;
  const stored = p.translations[lang];
  const t = stored?.description ? stored : fallback;

  return {
    ...p,
    name: t?.name || p.name,
    style: t?.style || p.style,
    description: t?.description || p.description,
    ingredients: t?.ingredients || p.ingredients,
    preparation: t?.preparation || p.preparation,
  };
}
export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
export type Recommendation = {
  ids: string[];
  allergy: boolean;
  plan?: { totalMXN: number; people: number };
  topic?: string;
};
export function recommend(bar: Bar, message: string): Recommendation {
  const q = normalize(message);
  let list = bar.products.filter(
    (p) => p.available && !p.isAddon && p.priceKnown !== false,
  );
  if (
    /alerg|allerg|mani|peanut|cacahuate|nue[cz]|gluten|lactos|乳|过敏|аллерг/.test(
      q,
    )
  )
    return { ids: [], allergy: true, topic: "alergenos" };
  const zero =
    /sin alcohol|alcohol.free|non.alcohol|sans alcool|无酒精|без алкоголя|tengo (?:1[0-7]|[1-9]) anos|menor de edad/.test(
      q,
    );
  const beer = /cerveza|beer|biere|啤酒|пиво/.test(q),
    food = /comida|comer|food|eat|manger|hambre|platillo|分享|еда|repas/.test(
      q,
    );
  const low =
    /no.*amarg|poco.*amarg|suave|not.*bitter|isn.t bitter|low.*bitter|peu amer|pas.*amer|苦味较少|不.*苦|без.*гореч/.test(
      q,
    );
  if (zero)
    list = list.filter(
      (p) => p.abv === 0 && (p.family === "zero" || p.category === "zero"),
    );
  else if (low)
    list = list.filter(
      (p) =>
        ((p.family === "beer" || ["tap", "bottle"].includes(p.category)) &&
          p.ibuKnown !== false &&
          p.ibu <= 20) ||
        (!beer &&
          ["cocktail", "zero"].includes(p.category) &&
          ["dulce", "frutal", "citrico"].includes(p.profile)),
    );
  else if (food)
    list = list.filter(
      (p) => p.family === "food" || ["food", "share"].includes(p.category),
    );
  else if (beer)
    list = list.filter(
      (p) => p.family === "beer" || ["tap", "bottle"].includes(p.category),
    );
  else if (/coct|cocktail/.test(q))
    list = list.filter(
      (p) => p.family === "cocktail" || p.category === "cocktail",
    );
  const budgetMatch =
    q.match(
      /(?:menos de|hasta|under|budget|presupuesto|moins de|до|\$)\s*\$?\s*(\d+(?:\.\d+)?)/,
    ) || q.match(/(\d+)\s*比索以下/);
  const budget = budgetMatch ? Number(budgetMatch[1]) : null;
  if (budget !== null) list = list.filter((p) => p.price <= budget);
  const party = q.match(/(?:entre|para|for|pour|на)\s*(\d+)/),
    people = party ? Math.min(20, Number(party[1])) : 0;
  if ((people > 1 || /compartir|share|partager/.test(q)) && budget !== null) {
    const options = bar.products
      .filter(
        (p) =>
          p.available &&
          !p.isAddon &&
          p.priceKnown !== false &&
          (["share", "food"].includes(p.category) ||
            /Bites|Burgers|Handhelds|Mains/.test(p.style)),
      )
      .sort(
        (a, b) =>
          Number(b.category === "share") - Number(a.category === "share") ||
          Number(b.popular) - Number(a.popular),
      );
    let total = 0;
    const ids: string[] = [];
    for (const p of options) {
      if (total + p.price <= budget && ids.length < 3) {
        ids.push(p.id);
        total += p.price;
      }
    }
    return {
      ids,
      allergy: false,
      plan: { totalMXN: Math.round(total * 100) / 100, people },
      topic: "presupuesto",
    };
  }
  const alias: Record<string, string> = {
    hamburguesa: "burger",
    hamburger: "burger",
    burger: "burger",
    brownie: "brownie",
    postre: "brownie",
    limonada: "limonada",
    lemonade: "limonada",
    ribeye: "tacos",
    papas: "papas",
    fries: "papas",
    alitas: "wings",
    wings: "wings",
  };
  const named = list.filter(
    (p) =>
      q.includes(normalize(p.name)) ||
      q.includes(p.id) ||
      Object.entries(alias).some(
        ([term, id]) => id === p.id && q.includes(term),
      ),
  );
  if (named.length) list = named;
  return {
    ids: list
      .sort((a, b) => Number(b.popular) - Number(a.popular))
      .slice(0, 3)
      .map((p) => p.id),
    allergy: false,
    topic:
      budget !== null
        ? "presupuesto"
        : zero
          ? "sin alcohol"
          : low
            ? "amargor"
            : named.length
              ? "ingredientes"
              : "recomendacion",
  };
}

export function displaySize(size: string, lang: Lang) {
  const known: Record<string, string[]> = {
    Standard: ["Porción", "Serving", "Portion", "份", "Порция"],
    Pint: ["Pinta", "Pint", "Pinte", "品脱", "Пинта"],
    Liter: ["Litro", "Liter", "Litre", "升", "Литр"],
    Glass: ["Copa", "Glass", "Verre", "杯", "Бокал"],
    Bottle: ["Botella", "Bottle", "Bouteille", "瓶", "Бутылка"],
    "Three choices": ["Tres opciones", "Three choices", "Trois choix", "三种选择", "Три варианта"],
  };
  if (known[size]) return known[size][langs.indexOf(lang)];
  if (lang === "es") return size;
  const i = langs.indexOf(lang) - 1;
  return size
    .replace("piezas", ["pieces", "pièces", "份", "шт."][i])
    .replace("pieza", ["piece", "pièce", "份", "шт."][i])
    .replace("porción", ["serving", "portion", "份", "порция"][i])
    .replace("de carne", ["beef", "de viande", "牛肉", "мяса"][i]);
}
