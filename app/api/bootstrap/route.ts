import { withRates } from "../../../lib/rates";
import { getChatGPTUser } from "../../chatgpt-auth";
import {
  db,
  json,
  error,
  originGuard,
  provision,
  ownedBar,
} from "../../../lib/server";
export async function GET() {
  try {
    const u = await getChatGPTUser();
    if (!u) return json({ authenticated: false, bar: null });
    const row = await db()
      .prepare("SELECT data,revision FROM bars WHERE owner_id=?")
      .bind(u.userId)
      .first<{ data: string; revision: number }>();
    return json({
      authenticated: true,
      displayName: u.displayName,
      bar: row
        ? await withRates({ ...JSON.parse(row.data), revision: row.revision })
        : null,
    });
  } catch (e) {
    return error(e);
  }
}
export async function POST(r: Request) {
  try {
    originGuard(r);
    return json({ bar: await provision() });
  } catch (e) {
    return error(e);
  }
}
