import { json, error, originGuard, ownedBar } from "../../../lib/server";
import { referenceRates } from "../../../lib/rates";
export async function POST(r: Request) {
  try {
    originGuard(r);
    const { bar } = await ownedBar();
    const d = await referenceRates(bar.baseCurrency || "MXN");
    return json({ rates: d.rates, date: d.date });
  } catch (e) {
    return error(e);
  }
}
