import { ImageResponse } from "next/og";

// iOS necesita PNG para el ícono de pantalla de inicio: ImageResponse lo
// genera en el build, sin subir binarios al repo.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0E0D",
          color: "#B8FF34",
          fontSize: 108,
          fontWeight: 700,
          letterSpacing: "-0.05em",
        }}
      >
        R
      </div>
    ),
    { ...size },
  );
}
