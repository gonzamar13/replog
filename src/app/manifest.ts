import type { MetadataRoute } from "next";

// PWA real: con esto "Agregar a inicio" en el iPhone abre en modo
// standalone (sin barra de Safari) y con el ícono propio.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RepLog",
    short_name: "RepLog",
    description: "Track. Train. Progress.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0B0E0D",
    theme_color: "#0B0E0D",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
