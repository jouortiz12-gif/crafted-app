import type { Bar } from "./types";
let cached: {
  rates: { USD: number; EUR: number; MXN?: number };
  base: string;
  date: string;
  expires: number;
} | null = null;
export async function referenceRates(base = "MXN") {
  if (cached && cached.base === base && cached.expires > Date.now())
    return cached;
  const r = await fetch(
    `https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${base === "USD" ? "MXN,EUR" : "USD,EUR"}`,
    { signal: AbortSignal.timeout(6000) },
  );
  if (!r.ok) throw new Error("No se pudo consultar la tasa");
  const d: any = await r.json();
  if (
    !Number.isFinite(d.rates?.[base === "USD" ? "MXN" : "USD"]) ||
    !Number.isFinite(d.rates?.EUR) ||
    d.rates[base === "USD" ? "MXN" : "USD"] <= 0 ||
    d.rates.EUR <= 0 ||
    typeof d.date !== "string"
  )
    throw new Error("Respuesta de divisas inválida");
  cached = {
    rates: {
      USD: base === "USD" ? 1 : d.rates.USD,
      EUR: d.rates.EUR,
      MXN: base === "USD" ? d.rates.MXN : 1,
    },
    base,
    date: d.date,
    expires: Date.now() + 6 * 60 * 60 * 1000,
  };
  return cached;
}
export async function withRates(bar: Bar) {
  if (bar.rateMode !== "auto") return bar;
  try {
    const d = await referenceRates(bar.baseCurrency || "MXN");
    return { ...bar, rates: d.rates, rateDate: d.date };
  } catch {
    return { ...bar, rateDate: bar.rateDate + " · Última tasa guardada" };
  }
}
