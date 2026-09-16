import { AppNav } from "@/components/app-nav";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RepLog",
  description: "Track. Train. Progress.",
  applicationName: "RepLog",
  // Hace que al agregarla a la pantalla de inicio abra como app,
  // sin la barra de Safari.
  appleWebApp: {
    capable: true,
    title: "RepLog",
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0E0D",
  // Necesario para que env(safe-area-inset-*) funcione en standalone:
  // sin esto, los botones de abajo quedan bajo la barra del iPhone.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      {/* Next emite mobile-web-app-capable (el estándar), pero iOS
          anterior a 16.4 sigue necesitando el suyo para abrir en
          standalone. React lo sube solo al <head>. */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <body className="min-h-dvh bg-canvas text-ink">
        <div className="lg:flex">
          <AppNav />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
