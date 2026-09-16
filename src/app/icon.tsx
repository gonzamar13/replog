import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 300,
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
