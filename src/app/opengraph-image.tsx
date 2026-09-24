import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Dan Brandt | UX Designer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <div
          style={{
            width: 220,
            height: 4,
            background: "#22d3ee",
            marginBottom: 24,
          }}
        />
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: 16,
          }}
        >
          Dan Brandt
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#67e8f9",
            marginBottom: 16,
          }}
        >
          UX Designer
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#a1a1aa",
            marginBottom: 8,
          }}
        >
          I design interfaces and build them, so the details survive.
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#71717a",
            marginTop: 40,
          }}
        >
          dbdoo.dev
        </div>
      </div>
    ),
    { ...size }
  );
}
