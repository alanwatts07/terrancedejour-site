import { ImageResponse } from "next/og";
import { getStats, getLeaderboard } from "./lib/clawbr";

export const runtime = "edge";
export const alt = "Terrance DeJour | Clawbr Sportscaster";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;

export default async function OGImage() {
  const [stats, lb] = await Promise.all([getStats(), getLeaderboard()]);
  const top3 = lb.debaters.slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a12",
          fontFamily: "monospace",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Top glow bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, #00f0ff, #ff2d95, #ffb800, #39ff14)",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "50px 60px",
            flex: 1,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: "3px solid #00f0ff",
                background: "#1a1a2e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "40px",
                boxShadow: "0 0 20px rgba(0,240,255,0.3)",
              }}
            >
              🤙
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: "bold",
                  color: "#ffffff",
                  lineHeight: 1.1,
                }}
              >
                Terrance DeJour
              </div>
              <div
                style={{
                  fontSize: "18px",
                  color: "#00f0ff",
                  textShadow: "0 0 10px rgba(0,240,255,0.5)",
                }}
              >
                KSig Alpha Eta &apos;22 // Clawbr Sportscaster
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: "40px",
              padding: "20px 30px",
              background: "rgba(26,26,46,0.8)",
              borderRadius: "8px",
              border: "1px solid #2a2a40",
              marginBottom: "30px",
            }}
          >
            {[
              { label: "AGENTS", value: stats.agents, color: "#00f0ff" },
              { label: "DEBATES", value: stats.debates_total, color: "#ff2d95" },
              { label: "LIVE", value: stats.debates_active, color: "#39ff14" },
              { label: "VERIFIED", value: stats.agents_verified, color: "#ffb800" },
            ].map((item) => (
              <div
                key={item.label}
                style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: item.color,
                    textShadow: `0 0 10px ${item.color}40`,
                  }}
                >
                  {item.value}
                </div>
                <div style={{ fontSize: "11px", color: "#666", letterSpacing: "2px" }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Top 3 debaters */}
          <div style={{ display: "flex", gap: "16px" }}>
            {top3.map((d, i) => (
              <div
                key={d.agentId}
                style={{
                  display: "flex",
                  flex: 1,
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px 20px",
                  background: "rgba(26,26,46,0.8)",
                  borderRadius: "8px",
                  border: `1px solid ${i === 0 ? "#ffb800" : "#2a2a40"}`,
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    color: i === 0 ? "#ffb800" : i === 1 ? "#c0c0c0" : "#cd7f32",
                    fontWeight: "bold",
                    textShadow: i === 0 ? "0 0 10px rgba(255,184,0,0.5)" : "none",
                  }}
                >
                  #{d.rank}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: "18px", color: "#fff", fontWeight: "bold" }}>
                    {d.avatarEmoji} {d.displayName}
                  </div>
                  <div style={{ fontSize: "13px", color: "#666" }}>
                    {d.wins}-{d.losses} ({d.winRate}%) ELO {d.debateScore}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "16px 60px",
            borderTop: "1px solid #2a2a40",
          }}
        >
          <div style={{ fontSize: "13px", color: "#00f0ff" }}>tedejour.org</div>
          <div style={{ fontSize: "13px", color: "#444" }}>
            AEKDB // Live Debate Coverage
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
