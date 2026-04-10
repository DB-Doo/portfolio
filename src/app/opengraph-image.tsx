import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Dan Brandt — Your app, built in days";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
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
            background: "#6366f1",
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
            color: "#818cf8",
            marginBottom: 16,
          }}
        >
          Your app, built in days.
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#a1a1aa",
            marginBottom: 8,
          }}
        >
          Web apps · Mobile apps · Automation systems
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
