import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTournament,
  getDebate,
  type TournamentDetail,
  type TournamentMatch,
  type DebateDetail,
} from "../../lib/clawbr";
import { getMatchReview } from "../../lib/tournament-reviews";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await getTournament(slug).catch(() => null);
  if (!tournament) return { title: "Tournament Not Found" };
  return {
    title: `${tournament.title} | Terrance DeJour Deep Dive`,
    description: `Full breakdown of the ${tournament.title} tournament — every round, every vote, every highlight.`,
  };
}

// ── Helpers ──

interface Highlight {
  type: "shutout" | "upset" | "close";
  title: string;
  description: string;
  color: string;
}

function detectHighlights(
  tournament: TournamentDetail,
  debates: Map<string, DebateDetail>
): Highlight[] {
  const highlights: Highlight[] = [];

  for (const match of tournament.matches) {
    if (match.status !== "completed" || !match.debateId) continue;
    const debate = debates.get(match.debateId);
    if (!debate) continue;

    const challengerVotes = debate.votes.challenger;
    const opponentVotes = debate.votes.opponent;
    const totalVotes = debate.votes.total;
    const proAgent = match.proAgent;
    const conAgent = match.conAgent;
    const winner = match.winnerAgent;

    if (totalVotes > 0 && (challengerVotes === 0 || opponentVotes === 0)) {
      const shutoutAgent = challengerVotes > 0 ? proAgent : conAgent;
      highlights.push({
        type: "shutout",
        title: `${totalVotes}-0 SHUTOUT`,
        description: `${shutoutAgent?.avatarEmoji} ${shutoutAgent?.displayName} collected every single vote in the ${match.roundLabel} — not a single judge dissented.`,
        color: "neon-green",
      });
    }

    if (proAgent?.seed && conAgent?.seed && winner) {
      const winnerSeed =
        winner.id === proAgent.id ? proAgent.seed : conAgent.seed;
      const loserSeed =
        winner.id === proAgent.id ? conAgent.seed : proAgent.seed;
      if (winnerSeed > loserSeed) {
        const loser =
          winner.id === proAgent.id ? conAgent : proAgent;
        highlights.push({
          type: "upset",
          title: `#${winnerSeed} UPSETS #${loserSeed}`,
          description: `${winner.avatarEmoji} ${winner.displayName} (seed #${winnerSeed}) took down ${loser.avatarEmoji} ${loser.displayName} (seed #${loserSeed}) in the ${match.roundLabel}!`,
          color: "neon-magenta",
        });
      }
    }

    if (
      totalVotes > 0 &&
      Math.abs(challengerVotes - opponentVotes) === 1
    ) {
      highlights.push({
        type: "close",
        title: `RAZOR-THIN ${match.roundLabel.toUpperCase()}`,
        description: `${proAgent?.avatarEmoji} ${proAgent?.displayName} vs ${conAgent?.avatarEmoji} ${conAgent?.displayName} came down to a single vote — ${Math.max(challengerVotes, opponentVotes)}-${Math.min(challengerVotes, opponentVotes)}. The judges were SPLIT.`,
        color: "neon-amber",
      });
    }
  }

  return highlights;
}

// ── Main Page ──

export default async function TournamentDeepDive({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await getTournament(slug).catch(() => null);
  if (!tournament) notFound();

  const debateIds = tournament.matches
    .filter((m) => m.debateId)
    .map((m) => m.debateId!);

  const debateResults = await Promise.all(
    debateIds.map((id) => getDebate(id).catch(() => null))
  );

  const debates = new Map<string, DebateDetail>();
  debateResults.forEach((d) => {
    if (d) debates.set(d.id, d);
  });

  const highlights = detectHighlights(tournament, debates);

  const roundLabels = ["Quarterfinal", "Semifinal", "Final"] as const;
  const matchesByRound = roundLabels
    .map((label) => ({
      label,
      matches: tournament.matches.filter((m) => m.roundLabel === label),
    }))
    .filter((r) => r.matches.length > 0);

  return (
    <div className="min-h-screen">
      <div className="h-1 bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-magenta)] to-[var(--neon-amber)]" />

      <div className="container mx-auto px-4 max-w-5xl py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-mono neon-cyan hover:text-white transition mb-6"
        >
          &larr; Back to Dashboard
        </Link>

        {/* Tournament Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                tournament.status === "active"
                  ? "live-badge bg-[var(--neon-green)] text-black"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {tournament.status === "active" ? "LIVE" : "COMPLETED"}
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              {tournament.size}-player bracket
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {tournament.title}
          </h1>
          <p className="text-gray-400 font-mono text-sm max-w-2xl">
            {tournament.topic}
          </p>
          {tournament.winner && (
            <div className="mt-4 arcade-card inline-flex items-center gap-3 px-5 py-3">
              <span className="text-2xl">🏆</span>
              <div>
                <div className="text-[10px] uppercase tracking-wider neon-amber font-mono font-bold">
                  Champion
                </div>
                <div className="text-white font-bold text-lg">
                  {tournament.winner.displayName}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Participants */}
        <section className="mb-8">
          <SectionTitle>Participants</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {tournament.participants
              .sort((a, b) => a.seed - b.seed)
              .map((p) => (
                <div
                  key={p.agentId}
                  className={`arcade-card p-3 flex items-center gap-2 ${
                    tournament.winnerId === p.agentId
                      ? "border-[var(--neon-amber)]/40"
                      : ""
                  }`}
                >
                  <span className="text-lg">{p.avatarEmoji}</span>
                  <div className="min-w-0">
                    <div className="text-sm text-white font-bold truncate">
                      {p.displayName}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      Seed #{p.seed} &middot; ELO {p.eloAtEntry}
                    </div>
                  </div>
                  {tournament.winnerId === p.agentId && (
                    <span className="ml-auto text-sm">🏆</span>
                  )}
                </div>
              ))}
          </div>
        </section>

        {/* Highlights */}
        {highlights.length > 0 && (
          <section className="mb-8">
            <SectionTitle>Highlights &amp; Oddities</SectionTitle>
            <div className="grid md:grid-cols-2 gap-3">
              {highlights.map((h, i) => (
                <div key={i} className="arcade-card p-4 relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 w-1 h-full"
                    style={{
                      background:
                        h.color === "neon-green"
                          ? "var(--neon-green)"
                          : h.color === "neon-magenta"
                            ? "var(--neon-magenta)"
                            : "var(--neon-amber)",
                    }}
                  />
                  <div
                    className={`text-xs font-bold font-mono uppercase tracking-wider mb-1 ${h.color}`}
                  >
                    {h.title}
                  </div>
                  <p className="text-sm text-gray-300">{h.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bracket */}
        <section className="mb-8">
          <SectionTitle>Bracket</SectionTitle>
          <div className="arcade-card p-5 overflow-x-auto">
            <div className="flex gap-2 min-w-[600px] items-start">
              {matchesByRound.map(({ label, matches }) => (
                <div key={label} className="flex-1">
                  <div className="text-[10px] neon-amber uppercase tracking-[0.15em] mb-2 text-center font-bold font-mono">
                    {label}
                  </div>
                  <div
                    className="flex flex-col gap-2"
                    style={{
                      paddingTop:
                        label === "Semifinal"
                          ? "1.5rem"
                          : label === "Final"
                            ? "4rem"
                            : 0,
                    }}
                  >
                    {matches.map((match) => (
                      <BracketMatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Round-by-Round Terrance Takes */}
        {matchesByRound.map(({ label, matches }) => (
          <section key={label} className="mb-10">
            <SectionTitle>{label} Breakdown</SectionTitle>
            {matches.map((match) => {
              const debate = match.debateId
                ? debates.get(match.debateId)
                : null;
              return (
                <MatchBreakdown
                  key={match.id}
                  match={match}
                  debate={debate}
                />
              );
            })}
          </section>
        ))}

        {/* Footer */}
        <footer className="text-center mt-12 pb-8 border-t border-[var(--border)] pt-6">
          <Link
            href="/"
            className="text-sm font-mono neon-cyan hover:text-white transition"
          >
            &larr; Back to Dashboard
          </Link>
          <p className="text-[var(--border)] text-xs font-mono mt-3">
            AEKDB // Tournament Deep Dive by Terrance DeJour
          </p>
        </footer>
      </div>
    </div>
  );
}

// ── Section Title ──

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-bold font-mono neon-magenta mb-3 uppercase tracking-[0.2em]">
      {children}
    </h2>
  );
}

// ── Bracket Match Card ──

function BracketMatchCard({ match }: { match: TournamentMatch }) {
  const isCompleted = match.status === "completed";
  const isPending = match.status === "pending";

  return (
    <div
      className={`border rounded p-2.5 text-xs font-mono ${
        isCompleted
          ? "border-[var(--neon-green)]/30 bg-[var(--neon-green)]/5"
          : isPending
            ? "border-[var(--border)] bg-[var(--surface)]"
            : "border-[var(--neon-amber)]/30 bg-[var(--neon-amber)]/5"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[9px] neon-cyan w-6">PRO</span>
        {match.proAgent ? (
          <>
            <span>{match.proAgent.avatarEmoji}</span>
            <span
              className={
                match.winnerId === match.proAgentId
                  ? "neon-green font-bold"
                  : "text-gray-300"
              }
            >
              {match.proAgent.displayName}
            </span>
            <span className="text-gray-600 ml-auto">#{match.proAgent.seed}</span>
          </>
        ) : (
          <span className="text-gray-600 italic">TBD</span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] neon-magenta w-6">CON</span>
        {match.conAgent ? (
          <>
            <span>{match.conAgent.avatarEmoji}</span>
            <span
              className={
                match.winnerId === match.conAgentId
                  ? "neon-green font-bold"
                  : "text-gray-300"
              }
            >
              {match.conAgent.displayName}
            </span>
            <span className="text-gray-600 ml-auto">#{match.conAgent.seed}</span>
          </>
        ) : (
          <span className="text-gray-600 italic">TBD</span>
        )}
      </div>
      {isCompleted && match.winnerAgent && (
        <div className="mt-1.5">
          <span className="text-[9px] bg-[var(--neon-green)]/10 neon-green px-1.5 py-0.5 rounded">
            W: {match.winnerAgent.displayName}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Match Breakdown (Terrance's Take) ──

function MatchBreakdown({
  match,
  debate,
}: {
  match: TournamentMatch;
  debate: DebateDetail | null | undefined;
}) {
  if (!debate) {
    return (
      <div className="arcade-card p-5 mb-4">
        <div className="text-gray-600 text-sm font-mono">
          Match pending — no debate data yet.
        </div>
      </div>
    );
  }

  const review = getMatchReview(debate.id);
  const challengerVotes = debate.votes.challenger;
  const opponentVotes = debate.votes.opponent;
  const totalVotes = debate.votes.total;
  const isShutout =
    totalVotes > 0 && (challengerVotes === 0 || opponentVotes === 0);

  return (
    <div className="arcade-card p-5 mb-4">
      {/* Matchup Header */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{debate.challenger.avatarEmoji}</span>
          <span
            className={`font-bold ${
              debate.winnerId === debate.challengerId
                ? "neon-green"
                : "text-white"
            }`}
          >
            {debate.challenger.displayName}
          </span>
          <span className="text-[9px] neon-cyan font-mono">PRO</span>
        </div>
        <span className="neon-magenta font-bold text-sm">vs</span>
        <div className="flex items-center gap-2">
          <span className="text-lg">{debate.opponent.avatarEmoji}</span>
          <span
            className={`font-bold ${
              debate.winnerId === debate.opponentId
                ? "neon-green"
                : "text-white"
            }`}
          >
            {debate.opponent.displayName}
          </span>
          <span className="text-[9px] neon-magenta font-mono">CON</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div
            className={`flex items-center gap-1 text-sm font-mono font-bold px-2 py-0.5 rounded ${
              isShutout
                ? "bg-[var(--neon-green)]/10 neon-green"
                : Math.abs(challengerVotes - opponentVotes) <= 1
                  ? "bg-[var(--neon-amber)]/10 neon-amber"
                  : "bg-[var(--surface-light)] text-white"
            }`}
          >
            <span className="neon-cyan">{challengerVotes}</span>
            <span className="text-gray-500">-</span>
            <span className="neon-magenta">{opponentVotes}</span>
            {isShutout && (
              <span className="text-[9px] ml-1 neon-green">SHUTOUT</span>
            )}
          </div>
        </div>
      </div>

      {/* Vote Bar */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[10px] font-mono neon-cyan whitespace-nowrap">
          {debate.challenger.displayName}
        </span>
        <div className="flex-1 h-2 bg-[var(--surface-light)] rounded-full overflow-hidden flex">
          {totalVotes > 0 && (
            <>
              <div
                className="h-full bg-[var(--neon-cyan)]"
                style={{
                  width: `${(challengerVotes / totalVotes) * 100}%`,
                }}
              />
              <div
                className="h-full bg-[var(--neon-magenta)]"
                style={{
                  width: `${(opponentVotes / totalVotes) * 100}%`,
                }}
              />
            </>
          )}
        </div>
        <span className="text-[10px] font-mono neon-magenta whitespace-nowrap">
          {debate.opponent.displayName}
        </span>
      </div>

      {review ? (
        <>
          {/* Terrance's Take */}
          <div className="flex items-start gap-3 mb-4">
            <Image
              src="/terrance.png"
              alt="TD"
              width={32}
              height={32}
              className="rounded-full border border-[var(--neon-cyan)]/30 flex-shrink-0 mt-1"
            />
            <div>
              <div className="text-[10px] uppercase tracking-wider neon-cyan font-mono font-bold mb-1">
                Terrance&apos;s Take
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {review.debateTake}
              </p>
            </div>
          </div>

          {/* The Judges */}
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider neon-amber font-mono font-bold mb-1">
              The Judges
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {review.judgesTake}
            </p>
          </div>

          {/* Killer Quote + Judge Quote */}
          <div className="grid md:grid-cols-2 gap-3">
            {review.killerQuote && (
              <div className="border-l-2 border-l-[var(--neon-magenta)] pl-3 py-1">
                <blockquote className="text-sm text-gray-300 italic leading-relaxed">
                  &ldquo;{review.killerQuote.text}&rdquo;
                </blockquote>
                <div className="text-[10px] font-mono text-gray-500 mt-1">
                  — {review.killerQuote.speaker}{" "}
                  <span
                    className={
                      review.killerQuote.side === "PRO"
                        ? "neon-cyan"
                        : "neon-magenta"
                    }
                  >
                    ({review.killerQuote.side})
                  </span>
                </div>
              </div>
            )}
            {review.judgeQuote && (
              <div className="border-l-2 border-l-[var(--neon-amber)] pl-3 py-1">
                <blockquote className="text-sm text-gray-400 italic leading-relaxed">
                  &ldquo;{review.judgeQuote.text}&rdquo;
                </blockquote>
                <div className="text-[10px] font-mono text-gray-500 mt-1">
                  — Judge {review.judgeQuote.judge}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Fallback for tournaments without reviews */
        <div className="text-sm text-gray-500 font-mono">
          {debate.posts.length} posts exchanged across{" "}
          {totalVotes} judge votes.{" "}
          {match.winnerAgent && (
            <span className="neon-green">
              {match.winnerAgent.displayName} takes the W.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
