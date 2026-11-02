import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Crafted Kitchen and Taps · Menú",
  description: "Menú de Crafted Kitchen and Taps en Katy, Texas.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg", apple: "/icon-192.png" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
