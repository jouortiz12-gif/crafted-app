import type { Bar, Lang } from "./types";
import { localProduct, money } from "./menu";
export type OrderLine = { id: string; option: number; quantity: number };
export function orderItems(lines: OrderLine[], bar: Bar, lang: Lang) {
  return lines.flatMap((line) => {
    if (!line || typeof line.id !== "string") return [];
    const p = bar.products.find((p) => p.id === line.id);
    if (
      !p ||
      !p.available ||
      p.priceKnown === false ||
      !Number.isInteger(line.option) ||
      line.option < 0 ||
      (p.options?.length
        ? line.option >= p.options.length
        : line.option !== 0) ||
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > 99
    )
      return [];
    const option = p.options?.[line.option];
    return [
      {
        ...line,
        product: p,
        name: localProduct(p, lang).name,
        label: option?.label || p.size,
        price: option?.price ?? p.price,
      },
    ];
  });
}
export function orderTotal(lines: OrderLine[], bar: Bar) {
  return (
    orderItems(lines, bar, "es").reduce(
      (s, l) => s + Math.round(l.price * 100) * l.quantity,
      0,
    ) / 100
  );
}
export function changeQuantity(
  lines: OrderLine[],
  id: string,
  option: number,
  delta: number,
) {
  const current =
    lines.find((l) => l.id === id && l.option === option)?.quantity || 0;
  const quantity = Math.min(99, Math.max(0, current + delta));
  return [
    ...lines.filter((l) => !(l.id === id && l.option === option)),
    ...(quantity ? [{ id, option, quantity }] : []),
  ];
}
export function orderMessage(
  lines: OrderLine[],
  bar: Bar,
  lang: Lang,
  table: string,
  notes: string,
  customerName = "",
) {
  const items = orderItems(lines, bar, lang),
    base = bar.baseCurrency || "MXN";
  const labels = {
    es: [
      "Pedido para",
      "Mesa",
      "Subtotal",
      "Notas",
      "Por favor confirma disponibilidad y total final.",
    ],
    en: [
      "Order for",
      "Table",
      "Subtotal",
      "Notes",
      "Please confirm availability and the final total.",
    ],
    fr: [
      "Commande pour",
      "Table",
      "Sous-total",
      "Notes",
      "Merci de confirmer la disponibilité et le total final.",
    ],
    zh: ["订单", "桌号", "小计", "备注", "请确认供应情况与最终总价。"],
    ru: [
      "Заказ для",
      "Стол",
      "Подытог",
      "Примечания",
      "Подтвердите наличие и итоговую сумму.",
    ],
  }[lang];
  const nameLabel = {
    es: "Cliente",
    en: "Customer",
    fr: "Client",
    zh: "顾客",
    ru: "Клиент",
  }[lang];
  const clean = (value: string) => value.replace(/[\r\n]+/g, " ").trim();
  const identity = [
    customerName.trim() ? `${nameLabel}: ${clean(customerName)}` : "",
    table.trim() ? `${labels[1]}: ${clean(table)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return [
    `*${labels[0]} ${bar.name}*`,
    identity,
    items
      .map(
        (l) =>
          `${l.quantity} × ${l.name}${l.label ? " · " + l.label : ""}\n${money(l.price * l.quantity, base, bar)} ${base}`,
      )
      .join("\n\n"),
    `*${labels[2]}: ${money(orderTotal(lines, bar), base, bar)} ${base}*`,
    notes.trim() ? labels[3] + ": " + notes.trim() : "",
    labels[4],
  ]
    .filter(Boolean)
    .join("\n\n");
}
export function whatsappLink(phone: string | undefined, message: string) {
  const digits = (phone || "").replace(/^\+/, "");
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  return "https://wa.me/" + digits + "?text=" + encodeURIComponent(message);
}
