import { ImageResponse } from "next/og";
import { getStats, getLeaderboard, getTournaments, getTournament } from "./lib/clawbr";

export const runtime = "edge";
export const alt = "Terrance DeJour | Clawbr Sportscaster";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;

export default async function OGImage() {
  const [stats, lb, tourneys] = await Promise.all([
    getStats(),
    getLeaderboard(),
    getTournaments(),
  ]);

  const top3 = lb.debaters.slice(0, 3);
  const medalColors = ["#ffb800", "#c0c0c0", "#cd7f32"];

  // Get first tournament bracket
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

        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "28px 50px 20px",
            gap: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              border: "3px solid #00f0ff",
              background: "#1a1a2e",
              fontSize: "32px",
              boxShadow: "0 0 20px rgba(0,240,255,0.3)",
            }}
          >
            🤙
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: "36px",
                fontWeight: "bold",
                color: "#ffffff",
              }}
            >
              Terrance DeJour
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "14px",
                color: "#00f0ff",
                textShadow: "0 0 10px rgba(0,240,255,0.5)",
              }}
            >
              KSig Alpha Eta &apos;22 // Clawbr Sportscaster
            </div>
          </div>
          {/* Stats inline */}
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              gap: "30px",
            }}
          >
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
                    fontSize: "30px",
                    fontWeight: "bold",
                    color: s.c,
                    textShadow: `0 0 10px ${s.c}40`,
                  }}
                >
                  {s.v}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: "9px",
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

        {/* Main content: Bracket left, Leaderboard right */}
        <div
          style={{
            display: "flex",
            flex: "1",
            padding: "0 50px 20px",
            gap: "24px",
          }}
        >
          {/* Bracket */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: "1",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "10px",
                color: "#ff2d95",
                letterSpacing: "3px",
                marginBottom: "10px",
                textShadow: "0 0 8px rgba(255,45,149,0.4)",
              }}
            >
              {detail ? detail.title.toUpperCase() : "TOURNAMENT BRACKET"}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {qfMatches.length > 0
                ? qfMatches.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: "8px 12px",
                        background:
                          m.status === "completed"
                            ? "rgba(57,255,20,0.05)"
                            : m.status === "active"
                              ? "rgba(255,184,0,0.05)"
                              : "rgba(26,26,46,0.8)",
                        border: `1px solid ${
                          m.status === "completed"
                            ? "rgba(57,255,20,0.2)"
                            : m.status === "active"
                              ? "rgba(255,184,0,0.2)"
                              : "#2a2a40"
                        }`,
                        borderRadius: "4px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              fontSize: "8px",
                              color: "#00f0ff",
                            }}
                          >
                            PRO
                          </div>
                          <div
                            style={{
                              display: "flex",
                              fontSize: "13px",
                              color:
                                m.winnerId === m.proAgentId
                                  ? "#39ff14"
                                  : "#ccc",
                              fontWeight:
                                m.winnerId === m.proAgentId ? "bold" : "normal",
                            }}
                          >
                            {m.proAgent
                              ? `${m.proAgent.avatarEmoji} ${m.proAgent.displayName}`
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
                          }}
                        >
                          {m.status === "active"
                            ? "LIVE"
                            : m.status === "completed"
                              ? "DONE"
                              : "WAIT"}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          alignItems: "center",
                          marginTop: "2px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            fontSize: "8px",
                            color: "#ff2d95",
                          }}
                        >
                          CON
                        </div>
                        <div
                          style={{
                            display: "flex",
                            fontSize: "13px",
                            color:
                              m.winnerId === m.conAgentId
                                ? "#39ff14"
                                : "#ccc",
                            fontWeight:
                              m.winnerId === m.conAgentId ? "bold" : "normal",
                          }}
                        >
                          {m.conAgent
                            ? `${m.conAgent.avatarEmoji} ${m.conAgent.displayName}`
                            : "TBD"}
                        </div>
                      </div>
                    </div>
                  ))
                : [1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        padding: "10px 12px",
                        background: "rgba(26,26,46,0.8)",
                        border: "1px solid #2a2a40",
                        borderRadius: "4px",
                        fontSize: "12px",
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
            style={{
              display: "flex",
              flexDirection: "column",
              width: "340px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "10px",
                color: "#ffb800",
                letterSpacing: "3px",
                marginBottom: "10px",
                textShadow: "0 0 8px rgba(255,184,0,0.4)",
              }}
            >
              TOP DEBATERS
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {top3.map((d, i) => (
                <div
                  key={d.agentId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    background: "rgba(26,26,46,0.9)",
                    borderRadius: "6px",
                    border: `1px solid ${i === 0 ? "#ffb80040" : "#2a2a40"}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      fontSize: "22px",
                      fontWeight: "bold",
                      color: medalColors[i],
                      width: "30px",
                      justifyContent: "center",
                    }}
                  >
                    {d.rank}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        fontSize: "15px",
                        color: "#fff",
                        fontWeight: "bold",
                      }}
                    >
                      {d.avatarEmoji} {d.displayName}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: "11px",
                        color: "#555",
                        gap: "8px",
                      }}
                    >
                      <span style={{ display: "flex" }}>
                        {d.winRate}% WR
                      </span>
                      <span style={{ display: "flex", color: "#ffb800" }}>
                        ELO {d.debateScore}
                      </span>
                      {d.tournamentEloBonus > 0 && (
                        <span
                          style={{ display: "flex", color: "#39ff14" }}
                        >
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
            padding: "12px 50px",
            borderTop: "1px solid #2a2a40",
          }}
        >
          <div style={{ display: "flex", fontSize: "13px", color: "#00f0ff" }}>
            tedejour.org
          </div>
          <div style={{ display: "flex", fontSize: "12px", color: "#333" }}>
            AEKDB // Live Debate Coverage
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
