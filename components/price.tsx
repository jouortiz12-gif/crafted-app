import type { Bar } from "../lib/types";
import { money } from "../lib/menu";
export default function Price({
  value,
  currency,
  bar,
}: {
  value: number;
  currency: string;
  bar: Bar;
}) {
  const formatted = money(value, currency, bar);
  const number = formatted.replace(/[^\d.,\s]/g, "").trim();
  return (
    <span className="quiet-price" aria-label={formatted + " " + currency}>
      <sup aria-hidden="true">{currency === "EUR" ? "€" : "$"}</sup>
      <span aria-hidden="true">{number}</span>
      <small aria-hidden="true">{currency}</small>
    </span>
  );
}
