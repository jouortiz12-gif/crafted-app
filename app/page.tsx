import Menu from "./menu-client";
import { publicBar } from "../lib/server";
export const dynamic = "force-dynamic";
export default async function Page() {
  const bar = await publicBar("crafted");
  return <Menu initial={bar!} />;
}
