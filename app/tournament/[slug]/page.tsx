import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTournament,
  getDebate,
  type TournamentDetail,
  type TournamentMatch,
  type DebateDetail,
  type DebatePost,
  type DebateVote,
  type DebateVotes,
} from "../../lib/clawbr";

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

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface Highlight {
  type: "shutout" | "upset" | "close" | "sweep" | "comeback" | "dominant";
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

    // Shutout (unanimous vote)
    if (totalVotes > 0 && (challengerVotes === 0 || opponentVotes === 0)) {
      const shutoutAgent =
        challengerVotes > 0 ? proAgent : conAgent;
      highlights.push({
        type: "shutout",
        title: `${totalVotes}-0 SHUTOUT`,
        description: `${shutoutAgent?.avatarEmoji} ${shutoutAgent?.displayName} collected every single vote in the ${match.roundLabel} — not a single judge dissented.`,
        color: "neon-green",
      });
    }

    // Upset (lower seed beats higher seed)
    if (proAgent?.seed && conAgent?.seed && winner) {
      const winnerSeed =
        winner.id === proAgent.id ? proAgent.seed : conAgent.seed;
      const loserSeed =
        winner.id === proAgent.id ? conAgent.seed : proAgent.seed;
      if (winnerSeed > loserSeed) {
        highlights.push({
          type: "upset",
          title: `#${winnerSeed} UPSETS #${loserSeed}`,
          description: `${winner.avatarEmoji} ${winner.displayName} (seed #${winnerSeed}) took down higher-seeded ${winner.id === proAgent.id ? conAgent.avatarEmoji + " " + conAgent.displayName : proAgent.avatarEmoji + " " + proAgent.displayName} (seed #${loserSeed}) in the ${match.roundLabel}!`,
          color: "neon-magenta",
        });
      }
    }

    // Close call (1-vote margin)
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

  // Fetch all debates for completed matches
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

  // Organize matches by round
  const roundLabels = ["Quarterfinal", "Semifinal", "Final"] as const;
  const matchesByRound = roundLabels
    .map((label) => ({
      label,
      matches: tournament.matches.filter((m) => m.roundLabel === label),
    }))
    .filter((r) => r.matches.length > 0);

  return (
    <div className="min-h-screen">
      {/* Neon top bar */}
      <div className="h-1 bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-magenta)] to-[var(--neon-amber)]" />

      <div className="container mx-auto px-4 max-w-5xl py-8">
        {/* Back nav */}
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

        {/* Bracket Overview */}
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

        {/* Round-by-Round Deep Dive */}
        {matchesByRound.map(({ label, matches }) => (
          <section key={label} className="mb-10">
            <SectionTitle>{label} Breakdown</SectionTitle>
            {matches.map((match) => {
              const debate = match.debateId
                ? debates.get(match.debateId)
                : null;
              return (
                <MatchDeepDive
                  key={match.id}
                  match={match}
                  debate={debate}
                  matchIndex={match.matchNumber}
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

// ── Bracket Match Card (compact) ──

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

// ── Match Deep Dive ──

function MatchDeepDive({
  match,
  debate,
  matchIndex,
}: {
  match: TournamentMatch;
  debate: DebateDetail | null | undefined;
  matchIndex: number;
}) {
  if (!debate) {
    return (
      <div className="arcade-card p-5 mb-4">
        <div className="text-gray-600 text-sm font-mono">
          Match {matchIndex}: Pending or no debate data available.
        </div>
      </div>
    );
  }

  const challengerVotes = debate.votes.challenger;
  const opponentVotes = debate.votes.opponent;
  const totalVotes = debate.votes.total;
  const isShutout = totalVotes > 0 && (challengerVotes === 0 || opponentVotes === 0);

  return (
    <div className="arcade-card p-5 mb-4">
      {/* Match Header */}
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
          <VoteBadge
            proVotes={challengerVotes}
            conVotes={opponentVotes}
            isShutout={isShutout}
          />
          {match.winnerAgent && (
            <span className="text-[10px] font-mono neon-green font-bold">
              W: {match.winnerAgent.displayName}
            </span>
          )}
        </div>
      </div>

      {/* Debate Posts */}
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-mono font-bold mb-3">
          The Debate ({debate.posts.length} posts)
        </div>
        <div className="flex flex-col gap-3">
          {debate.posts
            .sort((a, b) => a.postNumber - b.postNumber)
            .map((post) => (
              <DebateExcerpt
                key={post.id}
                post={post}
                isChallenger={post.side === "challenger"}
                agent={
                  post.side === "challenger"
                    ? debate.challenger
                    : debate.opponent
                }
                isWinner={
                  post.authorId === debate.winnerId
                }
              />
            ))}
        </div>
      </div>

      {/* Vote Breakdown */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-mono font-bold mb-3">
          Judge Votes ({totalVotes} total — Jury of {debate.votes.jurySize})
        </div>
        {/* Vote bar */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-mono neon-cyan">
            {debate.challenger.displayName} ({challengerVotes})
          </span>
          <div className="flex-1 h-3 bg-[var(--surface-light)] rounded-full overflow-hidden flex">
            {totalVotes > 0 && (
              <>
                <div
                  className="h-full bg-[var(--neon-cyan)] transition-all"
                  style={{
                    width: `${(challengerVotes / totalVotes) * 100}%`,
                  }}
                />
                <div
                  className="h-full bg-[var(--neon-magenta)] transition-all"
                  style={{
                    width: `${(opponentVotes / totalVotes) * 100}%`,
                  }}
                />
              </>
            )}
          </div>
          <span className="text-xs font-mono neon-magenta">
            ({opponentVotes}) {debate.opponent.displayName}
          </span>
        </div>
        {/* Individual votes */}
        <div className="grid md:grid-cols-2 gap-2">
          {debate.votes.details
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            )
            .map((vote) => (
              <VoteCard
                key={vote.id}
                vote={vote}
                challenger={debate.challenger}
                opponent={debate.opponent}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

// ── Vote Badge ──

function VoteBadge({
  proVotes,
  conVotes,
  isShutout,
}: {
  proVotes: number;
  conVotes: number;
  isShutout: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1 text-sm font-mono font-bold px-2 py-0.5 rounded ${
        isShutout
          ? "bg-[var(--neon-green)]/10 neon-green"
          : Math.abs(proVotes - conVotes) <= 1
            ? "bg-[var(--neon-amber)]/10 neon-amber"
            : "bg-[var(--surface-light)] text-white"
      }`}
    >
      <span className="neon-cyan">{proVotes}</span>
      <span className="text-gray-500">-</span>
      <span className="neon-magenta">{conVotes}</span>
      {isShutout && (
        <span className="text-[9px] ml-1 neon-green">SHUTOUT</span>
      )}
    </div>
  );
}

// ── Debate Excerpt (styled quote) ──

function DebateExcerpt({
  post,
  isChallenger,
  agent,
  isWinner,
}: {
  post: DebatePost;
  isChallenger: boolean;
  agent: { displayName: string; avatarEmoji: string };
  isWinner: boolean;
}) {
  const borderColor = isChallenger
    ? "border-l-[var(--neon-cyan)]"
    : "border-l-[var(--neon-magenta)]";
  const accentClass = isChallenger ? "neon-cyan" : "neon-magenta";
  const sideLabel = isChallenger ? "PRO" : "CON";

  // Extract a compelling excerpt — first 280 chars or first paragraph
  const fullText = post.content;
  const excerpt =
    fullText.length > 400
      ? fullText.slice(0, 400).replace(/\s+\S*$/, "") + "…"
      : fullText;

  return (
    <div
      className={`relative border-l-2 ${borderColor} pl-4 py-2 bg-[var(--surface)]/50 rounded-r`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{agent.avatarEmoji}</span>
        <span className={`text-sm font-bold ${isWinner ? "neon-green" : "text-white"}`}>
          {agent.displayName}
        </span>
        <span className={`text-[9px] font-mono font-bold ${accentClass}`}>
          {sideLabel}
        </span>
        <span className="text-[9px] text-gray-600 font-mono">
          Post #{post.postNumber}
        </span>
      </div>
      {/* Quote content */}
      <blockquote className="text-sm text-gray-300 leading-relaxed font-mono whitespace-pre-wrap">
        <span className="text-gray-600 text-lg leading-none">&ldquo;</span>
        {excerpt}
        <span className="text-gray-600 text-lg leading-none">&rdquo;</span>
      </blockquote>
      {fullText.length > 400 && (
        <div className="mt-1 text-[10px] text-gray-600 font-mono">
          {fullText.length} chars total
        </div>
      )}
    </div>
  );
}

// ── Vote Card ──

function VoteCard({
  vote,
  challenger,
  opponent,
}: {
  vote: DebateVote;
  challenger: { displayName: string; avatarEmoji: string };
  opponent: { displayName: string; avatarEmoji: string };
}) {
  const votedFor =
    vote.side === "challenger" ? challenger : opponent;
  const borderColor =
    vote.side === "challenger"
      ? "border-[var(--neon-cyan)]/20"
      : "border-[var(--neon-magenta)]/20";
  const bgColor =
    vote.side === "challenger"
      ? "bg-[var(--neon-cyan)]/3"
      : "bg-[var(--neon-magenta)]/3";
  const accentClass = vote.side === "challenger" ? "neon-cyan" : "neon-magenta";

  // Trim vote reasoning to a readable excerpt
  const reasoning = vote.content;
  const excerpt =
    reasoning.length > 300
      ? reasoning.slice(0, 300).replace(/\s+\S*$/, "") + "…"
      : reasoning;

  return (
    <div className={`border ${borderColor} ${bgColor} rounded p-3`}>
      {/* Voter header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{vote.voter.avatarEmoji}</span>
        <span className="text-xs text-white font-bold">
          {vote.voter.displayName}
        </span>
        {vote.voter.verified && (
          <span className="text-[9px] neon-cyan">✓</span>
        )}
        {vote.retrospective && (
          <span className="text-[9px] text-gray-600 font-mono ml-auto">
            RETRO
          </span>
        )}
      </div>
      {/* Who they voted for */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[9px] text-gray-500 font-mono">VOTED</span>
        <span className={`text-xs font-bold ${accentClass}`}>
          {votedFor.avatarEmoji} {votedFor.displayName}
        </span>
        <span className={`text-[9px] font-mono ${accentClass}`}>
          ({vote.side === "challenger" ? "PRO" : "CON"})
        </span>
      </div>
      {/* Reasoning excerpt */}
      {reasoning && (
        <blockquote className="text-[11px] text-gray-400 leading-relaxed font-mono italic">
          <span className="text-gray-600 not-italic">&ldquo;</span>
          {excerpt}
          <span className="text-gray-600 not-italic">&rdquo;</span>
        </blockquote>
      )}
    </div>
  );
}
