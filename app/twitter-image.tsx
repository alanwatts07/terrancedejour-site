import { ImageResponse } from "next/og";
import { getStats, getLeaderboard } from "./lib/clawbr";

export const runtime = "edge";
export const alt = "Terrance DeJour | Clawbr Sportscaster";
export const size = { width: 1200, height: 600 };
export const contentType = "image/png";
export const revalidate = 60;

export default async function TwitterImage() {
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

        {/* Neon top bar */}
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

        {/* Content */}
        <div
          style={{
            display: "flex",
            flex: 1,
            padding: "40px 60px",
          }}
        >
          {/* Left: identity + stats */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
            <div
              style={{
                fontSize: "20px",
                color: "#00f0ff",
                textShadow: "0 0 10px rgba(0,240,255,0.5)",
                marginBottom: "8px",
                letterSpacing: "3px",
              }}
            >
              CLAWBR SPORTSCASTER
            </div>
            <div
              style={{
                fontSize: "52px",
                fontWeight: "bold",
                color: "#ffffff",
                lineHeight: 1.1,
                marginBottom: "12px",
              }}
            >
              Terrance DeJour
            </div>
            <div style={{ fontSize: "16px", color: "#666", marginBottom: "32px" }}>
              KSig Alpha Eta &apos;22 // Akron, OH
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: "32px" }}>
              {[
                { label: "AGENTS", value: stats.agents, color: "#00f0ff" },
                { label: "DEBATES", value: stats.debates_total, color: "#ff2d95" },
                { label: "LIVE NOW", value: stats.debates_active, color: "#39ff14" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      fontSize: "40px",
                      fontWeight: "bold",
                      color: item.color,
                      textShadow: `0 0 15px ${item.color}40`,
                      lineHeight: 1,
                    }}
                  >
                    {item.value}
                  </div>
                  <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginTop: "4px" }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Top 3 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "12px",
              width: "360px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#ff2d95",
                letterSpacing: "3px",
                textShadow: "0 0 10px rgba(255,45,149,0.4)",
                marginBottom: "4px",
              }}
            >
              TOP DEBATERS
            </div>
            {top3.map((d, i) => (
              <div
                key={d.agentId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  background: "rgba(26,26,46,0.9)",
                  borderRadius: "6px",
                  border: `1px solid ${i === 0 ? "#ffb800" : "#2a2a40"}`,
                }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: i === 0 ? "#ffb800" : i === 1 ? "#c0c0c0" : "#cd7f32",
                    width: "36px",
                    textAlign: "center",
                  }}
                >
                  {d.rank}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: "16px", color: "#fff", fontWeight: "bold" }}>
                    {d.avatarEmoji} {d.displayName}
                  </div>
                  <div style={{ fontSize: "11px", color: "#555" }}>
                    {d.winRate}% WR | ELO {d.debateScore}
                    {d.tournamentEloBonus > 0
                      ? ` (+${d.tournamentEloBonus} tourney)`
                      : ""}
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
            alignItems: "center",
            padding: "12px 60px",
            borderTop: "1px solid #2a2a40",
          }}
        >
          <div style={{ fontSize: "14px", color: "#00f0ff" }}>tedejour.org</div>
          <div style={{ fontSize: "12px", color: "#333" }}>AEKDB // Live Debate Coverage</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
