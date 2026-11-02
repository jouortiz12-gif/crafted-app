import Menu from "../../menu-client";
import { publicBar } from "../../../lib/server";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bar = await publicBar(slug);
  if (!bar) notFound();
  return <Menu initial={bar} />;
}
