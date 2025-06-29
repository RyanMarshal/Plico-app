import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const question = searchParams.get("question") || "Create a Poll";

    const response = new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f3f4f6",
            backgroundImage:
              "linear-gradient(to bottom right, #ec4899, #8b5cf6)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "white",
              borderRadius: "24px",
              padding: "48px",
              margin: "32px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              maxWidth: "90%",
            }}
          >
            {/* Plico Logo/Brand */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginBottom: "32px",
              }}
            >
              {/* Logo as styled text/shape */}
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(236, 72, 153, 0.3)",
                }}
              >
                P
              </div>
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: "bold",
                  background: "linear-gradient(to right, #ec4899, #8b5cf6)",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Plico
              </div>
            </div>

            {/* Question */}
            <div
              style={{
                fontSize: "48px",
                fontWeight: "bold",
                color: "#111827",
                textAlign: "center",
                marginBottom: "24px",
                maxWidth: "800px",
                lineHeight: "1.2",
              }}
            >
              {question}
            </div>

            {/* Call to action */}
            <div
              style={{
                fontSize: "24px",
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              Tap to vote instantly • No sign-up required
            </div>

            {/* Visual elements */}
            <div
              style={{
                display: "flex",
                gap: "16px",
                marginTop: "32px",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "8px",
                  backgroundColor: "#ec4899",
                  borderRadius: "4px",
                }}
              />
              <div
                style={{
                  width: "60px",
                  height: "8px",
                  backgroundColor: "#8b5cf6",
                  borderRadius: "4px",
                }}
              />
              <div
                style={{
                  width: "60px",
                  height: "8px",
                  backgroundColor: "#ec4899",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>

          {/* Bottom emoji decoration */}
          <div
            style={{
              position: "absolute",
              bottom: "32px",
              fontSize: "64px",
              opacity: "0.8",
            }}
          >
            🗳️
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
    
    // Set proper headers for Discord
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
    
    return response;
  } catch (e) {
    console.error("OG Image generation failed:", e);
    return new Response("Failed to generate image", { status: 500 });
  }
}
