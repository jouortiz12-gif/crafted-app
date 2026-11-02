import { publicBar, error } from "../../../lib/server";
export async function GET(r: Request) {
  try {
    const bar = await publicBar(
      new URL(r.url).searchParams.get("bar") || "demo",
    );
    if (!bar) return new Response(null, { status: 404 });
    const start = bar.id === "demo" ? "/" : "/b/" + bar.slug;
    return Response.json(
      {
        id: start,
        name: bar.name + " · Menú",
        short_name: bar.name.slice(0, 20),
        start_url: start,
        scope: "/",
        display: "standalone",
        background_color: "#101112",
        theme_color: "#101112",
        lang: "es",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/manifest+json",
          "Cache-Control": "no-cache",
        },
      },
    );
  } catch (e) {
    return error(e);
  }
}
