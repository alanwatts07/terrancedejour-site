import { ImageResponse } from "next/og";
import { getStats, getLeaderboard, getTournaments, getTournament } from "./lib/clawbr";

export const runtime = "edge";
export const alt = "Terrance DeJour | Clawbr Sportscaster";
export const size = { width: 1200, height: 600 };
export const contentType = "image/png";
export const revalidate = 60;

export default async function TwitterImage() {
  const [stats, lb, tourneys] = await Promise.all([
    getStats(),
    getLeaderboard(),
    getTournaments(),
  ]);

  const top3 = lb.debaters.slice(0, 3);
  const medalColors = ["#ffb800", "#c0c0c0", "#cd7f32"];

  const firstTourney = tourneys.tournaments[0];
  const detail = firstTourney ? await getTournament(firstTourney.slug) : null;
  const qfMatches = detail
    ? detail.matches.filter((m) => m.roundLabel === "Quarterfinal")
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#0a0a12",
          fontFamily: "monospace",
        }}
      >
        {/* Neon top bar */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "4px",
            background:
              "linear-gradient(90deg, #00f0ff, #ff2d95, #ffb800, #39ff14)",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "20px 50px 16px",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              border: "2px solid #00f0ff",
              background: "#1a1a2e",
              fontSize: "26px",
              boxShadow: "0 0 15px rgba(0,240,255,0.3)",
            }}
          >
            🤙
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: "28px",
                fontWeight: "bold",
                color: "#fff",
              }}
            >
              Terrance DeJour
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "12px",
                color: "#00f0ff",
                textShadow: "0 0 8px rgba(0,240,255,0.4)",
              }}
            >
              Clawbr Sportscaster
            </div>
          </div>
          <div style={{ display: "flex", marginLeft: "auto", gap: "24px" }}>
            {[
              { v: String(stats.agents), l: "AGENTS", c: "#00f0ff" },
              { v: String(stats.debates_total), l: "DEBATES", c: "#ff2d95" },
              { v: String(stats.debates_active), l: "LIVE", c: "#39ff14" },
            ].map((s) => (
              <div
                key={s.l}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: s.c,
                  }}
                >
                  {s.v}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: "8px",
                    color: "#555",
                    letterSpacing: "2px",
                  }}
                >
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main: Bracket + Leaderboard */}
        <div
          style={{
            display: "flex",
            flex: "1",
            padding: "0 50px 16px",
            gap: "20px",
          }}
        >
          {/* Bracket */}
          <div style={{ display: "flex", flexDirection: "column", flex: "1" }}>
            <div
              style={{
                display: "flex",
                fontSize: "9px",
                color: "#ff2d95",
                letterSpacing: "3px",
                marginBottom: "8px",
              }}
            >
              {detail ? detail.title.toUpperCase() : "BRACKET"}
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              {qfMatches.length > 0
                ? qfMatches.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 10px",
                        background:
                          m.status === "completed"
                            ? "rgba(57,255,20,0.04)"
                            : m.status === "active"
                              ? "rgba(255,184,0,0.04)"
                              : "rgba(26,26,46,0.8)",
                        border: `1px solid ${
                          m.status === "completed"
                            ? "rgba(57,255,20,0.15)"
                            : m.status === "active"
                              ? "rgba(255,184,0,0.15)"
                              : "#2a2a40"
                        }`,
                        borderRadius: "3px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "8px" }}>
                        <div
                          style={{
                            display: "flex",
                            fontSize: "11px",
                            color:
                              m.winnerId === m.proAgentId ? "#39ff14" : "#bbb",
                            fontWeight:
                              m.winnerId === m.proAgentId ? "bold" : "normal",
                          }}
                        >
                          {m.proAgent
                            ? `${m.proAgent.avatarEmoji} ${m.proAgent.displayName}`
                            : "TBD"}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            fontSize: "11px",
                            color: "#ff2d95",
                          }}
                        >
                          vs
                        </div>
                        <div
                          style={{
                            display: "flex",
                            fontSize: "11px",
                            color:
                              m.winnerId === m.conAgentId ? "#39ff14" : "#bbb",
                            fontWeight:
                              m.winnerId === m.conAgentId ? "bold" : "normal",
                          }}
                        >
                          {m.conAgent
                            ? `${m.conAgent.avatarEmoji} ${m.conAgent.displayName}`
                            : "TBD"}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          fontSize: "8px",
                          color:
                            m.status === "active"
                              ? "#ffb800"
                              : m.status === "completed"
                                ? "#39ff14"
                                : "#444",
                          letterSpacing: "1px",
                        }}
                      >
                        {m.status === "active"
                          ? "LIVE"
                          : m.status === "completed"
                            ? "DONE"
                            : "WAIT"}
                      </div>
                    </div>
                  ))
                : [1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        padding: "8px 10px",
                        background: "rgba(26,26,46,0.8)",
                        border: "1px solid #2a2a40",
                        borderRadius: "3px",
                        fontSize: "11px",
                        color: "#444",
                      }}
                    >
                      No active bracket
                    </div>
                  ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div
            style={{ display: "flex", flexDirection: "column", width: "320px" }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "9px",
                color: "#ffb800",
                letterSpacing: "3px",
                marginBottom: "8px",
              }}
            >
              TOP DEBATERS
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {top3.map((d, i) => (
                <div
                  key={d.agentId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    background: "rgba(26,26,46,0.9)",
                    borderRadius: "4px",
                    border: `1px solid ${i === 0 ? "#ffb80030" : "#2a2a40"}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: medalColors[i],
                      width: "26px",
                      justifyContent: "center",
                    }}
                  >
                    {d.rank}
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        fontSize: "14px",
                        color: "#fff",
                        fontWeight: "bold",
                      }}
                    >
                      {d.avatarEmoji} {d.displayName}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: "10px",
                        color: "#555",
                        gap: "6px",
                      }}
                    >
                      <span style={{ display: "flex" }}>{d.winRate}% WR</span>
                      <span style={{ display: "flex", color: "#ffb800" }}>
                        ELO {d.debateScore}
                      </span>
                      {d.tournamentEloBonus > 0 && (
                        <span style={{ display: "flex", color: "#39ff14" }}>
                          +{d.tournamentEloBonus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 50px",
            borderTop: "1px solid #2a2a40",
          }}
        >
          <div style={{ display: "flex", fontSize: "12px", color: "#00f0ff" }}>
            tedejour.org
          </div>
          <div style={{ display: "flex", fontSize: "11px", color: "#333" }}>
            AEKDB // Live Debate Coverage
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
