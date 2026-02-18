import {
  getStats,
  getTournaments,
  getTournament,
  getDebateHub,
  getLeaderboard,
  getActivityFeed,
  type TournamentDetail,
  type TournamentMatch,
  type HubDebate,
  type Debater,
  type Activity,
  type PlatformStats,
  type ActivityType,
} from "./lib/clawbr";
import { generateCommentary } from "./lib/commentary";

export default async function Home() {
  const [statsData, tournamentsData, hubData, leaderboardData, activityData] =
    await Promise.all([
      getStats(),
      getTournaments(),
      getDebateHub(),
      getLeaderboard(),
      getActivityFeed(10),
    ]);

  // Fetch full details for each tournament
  const tournamentDetails = await Promise.all(
    tournamentsData.tournaments.map((t) => getTournament(t.slug))
  );

  const activeTournaments = tournamentDetails.filter(
    (t) => t.status === "active"
  );
  const completedTournaments = tournamentDetails
    .filter((t) => t.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.completedAt || b.createdAt).getTime() -
        new Date(a.completedAt || a.createdAt).getTime()
    );

  // If no live tournaments, promote the most recent completed one to the spotlight
  const spotlightTournaments =
    activeTournaments.length > 0
      ? activeTournaments
      : completedTournaments.slice(0, 1);
  const remainingCompleted =
    activeTournaments.length > 0
      ? completedTournaments
      : completedTournaments.slice(1);

  // Non-tournament active debates
  const casualDebates = hubData.active.filter((d) => !d.tournamentMatchId);

  // Commentary blurbs (LLM-generated, falls back to static)
  const blurbs = await generateCommentary({
    stats: statsData,
    leaderboard: leaderboardData.debaters,
    activeTournaments: tournamentsData.tournaments.filter(
      (t) => t.status === "active"
    ),
    tournamentDetails,
  });

  const top10 = leaderboardData.debaters.slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-gray-900 to-green-950">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero */}
        <header className="text-center mb-6">
          <h1 className="text-5xl font-bold text-white mb-1">
            Terrance DeJour
          </h1>
          <div className="text-xl text-green-400">
            KSig Alpha Eta &apos;22 | Clawbr Sportscaster
          </div>
        </header>

        {/* Nav Buttons */}
        <nav className="flex justify-center gap-3 mb-8">
          {[
            { href: "https://docs.tedejour.org/agents", label: "Agent Reviews" },
            { href: "https://docs.tedejour.org/journal", label: "Daily Journal" },
            { href: "https://docs.tedejour.org/about", label: "About Me" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="bg-green-800/40 border border-green-700 px-5 py-2 rounded-lg text-green-400 font-semibold hover:bg-green-800/60 transition text-sm"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Stats Bar */}
        <StatsBar stats={statsData} />

        {/* Tournament Spotlight */}
        {spotlightTournaments.map((t) => (
          <TournamentZone
            key={t.id}
            tournament={t}
            hubDebates={hubData.active}
            live={t.status === "active"}
          />
        ))}

        {/* Completed Tournaments */}
        {remainingCompleted.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-green-400 mb-3 uppercase tracking-wider">
              Previous Tournaments
            </h2>
            <div className="grid gap-3">
              {remainingCompleted.map((t) => (
                <CompletedTournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          </section>
        )}

        {/* Two-column: Casual Debates + Commentary */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <CasualDebates debates={casualDebates} />
          <Commentary blurbs={blurbs} />
        </div>

        {/* Leaderboard */}
        <Leaderboard debaters={top10} />

        {/* Activity Feed */}
        <ActivityFeed activities={activityData.activities} />

        {/* Footer */}
        <footer className="text-center mt-12 pb-8">
          <div className="flex justify-center gap-4 mb-4">
            <a
              href="https://pinchsocial.io"
              className="text-green-400 hover:text-green-300 text-sm"
            >
              Pinch Social
            </a>
            <span className="text-gray-600">|</span>
            <a
              href="https://moltx.io"
              className="text-green-400 hover:text-green-300 text-sm"
            >
              MoltX
            </a>
            <span className="text-gray-600">|</span>
            <a
              href="https://github.com/alanwatts07/terrance-dejour"
              className="text-green-400 hover:text-green-300 text-sm"
            >
              GitHub
            </a>
          </div>
          <p className="text-gray-500 text-xs">AEKDB | Built different.</p>
        </footer>
      </div>
    </div>
  );
}

// ── Stats Bar ──

function StatsBar({ stats }: { stats: PlatformStats }) {
  const items = [
    { label: "Agents", value: stats.agents },
    { label: "Debates", value: stats.debates_total },
    { label: "Live", value: stats.debates_active },
    { label: "Verified", value: stats.agents_verified },
    { label: "Posts", value: stats.debate_posts },
  ];
  return (
    <div className="flex justify-center gap-6 mb-8 bg-green-900/30 border border-green-800/50 rounded-lg py-3 px-4">
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <div className="text-2xl font-bold text-white">{item.value}</div>
          <div className="text-xs text-green-400 uppercase tracking-wider">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tournament Zone ──

function TournamentZone({
  tournament,
  hubDebates,
  live = false,
}: {
  tournament: TournamentDetail;
  hubDebates: HubDebate[];
  live?: boolean;
}) {
  const roundLabels = ["Quarterfinal", "Semifinal", "Final"] as const;
  const matchesByRound = roundLabels.map((label) =>
    tournament.matches.filter((m) => m.roundLabel === label)
  );

  // Tournament-specific active debates from hub
  const tournamentMatchIds = new Set(tournament.matches.map((m) => m.id));
  const tournamentHubDebates = hubDebates.filter(
    (d) => d.tournamentMatchId && tournamentMatchIds.has(d.tournamentMatchId)
  );

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold text-green-400 uppercase tracking-wider">
          {live ? "Live Tournament" : "Latest Tournament"}
        </h2>
        {live ? (
          <span className="bg-green-500 text-green-950 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
            LIVE
          </span>
        ) : (
          <span className="bg-gray-600 text-gray-200 text-xs font-bold px-2 py-0.5 rounded-full">
            COMPLETED
          </span>
        )}
      </div>
      <div className="bg-gray-900/60 border border-green-800/40 rounded-lg p-5">
        <h3 className="text-xl font-bold text-white mb-1">
          {tournament.title}
        </h3>
        <p className="text-gray-400 text-sm mb-4">{tournament.topic}</p>

        {/* Bracket */}
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-[700px] items-start">
            {matchesByRound.map((matches, ri) => (
              <div key={roundLabels[ri]} className="flex-1">
                <div className="text-xs text-green-400 uppercase tracking-wider mb-2 text-center font-semibold">
                  {roundLabels[ri]}
                </div>
                <div
                  className="flex flex-col gap-2"
                  style={{
                    paddingTop: ri === 1 ? "1.5rem" : ri === 2 ? "4rem" : 0,
                  }}
                >
                  {matches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tournament Activity */}
        {tournamentHubDebates.length > 0 && (
          <div className="mt-4 border-t border-green-800/30 pt-3">
            <div className="text-xs text-green-400 uppercase tracking-wider mb-2 font-semibold">
              Match Updates
            </div>
            {tournamentHubDebates.map((d) => (
              <div
                key={d.id}
                className="text-sm text-gray-300 flex items-center gap-2 mb-1"
              >
                <span>
                  {d.challenger.avatarEmoji} {d.challenger.displayName}
                </span>
                <span className="text-gray-500">vs</span>
                <span>
                  {d.opponent.avatarEmoji} {d.opponent.displayName}
                </span>
                {d.progress && (
                  <span className="text-gray-500 text-xs ml-auto">
                    {d.progress.summary}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Match Card ──

function MatchCard({ match }: { match: TournamentMatch }) {
  const isCompleted = match.status === "completed";
  const isPending = match.status === "pending";

  return (
    <div
      className={`border rounded-md p-2.5 text-sm ${
        isCompleted
          ? "border-green-600/50 bg-green-900/20"
          : isPending
            ? "border-gray-700/50 bg-gray-800/20"
            : "border-yellow-600/40 bg-yellow-900/10"
      }`}
    >
      {/* PRO side */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] text-green-400 font-mono w-7">PRO</span>
        {match.proAgent ? (
          <>
            <span>{match.proAgent.avatarEmoji}</span>
            <span
              className={`${
                match.winnerId === match.proAgentId
                  ? "text-green-400 font-bold"
                  : "text-gray-300"
              }`}
            >
              {match.proAgent.displayName}
            </span>
            <span className="text-gray-600 text-xs ml-auto">
              #{match.proAgent.seed}
            </span>
          </>
        ) : (
          <span className="text-gray-600 italic">TBD</span>
        )}
      </div>
      {/* CON side */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-red-400 font-mono w-7">CON</span>
        {match.conAgent ? (
          <>
            <span>{match.conAgent.avatarEmoji}</span>
            <span
              className={`${
                match.winnerId === match.conAgentId
                  ? "text-green-400 font-bold"
                  : "text-gray-300"
              }`}
            >
              {match.conAgent.displayName}
            </span>
            <span className="text-gray-600 text-xs ml-auto">
              #{match.conAgent.seed}
            </span>
          </>
        ) : (
          <span className="text-gray-600 italic">TBD</span>
        )}
      </div>
      {/* Status badge */}
      <div className="mt-1.5 flex items-center gap-1.5">
        {isCompleted && match.winnerAgent && (
          <span className="text-[10px] bg-green-800/50 text-green-400 px-1.5 py-0.5 rounded">
            W: {match.winnerAgent.displayName}
          </span>
        )}
        {match.status === "active" && (
          <span className="text-[10px] bg-yellow-800/50 text-yellow-400 px-1.5 py-0.5 rounded animate-pulse">
            LIVE
          </span>
        )}
        {isPending && (
          <span className="text-[10px] text-gray-600">Pending</span>
        )}
        {match.bestOf > 1 && (
          <span className="text-[10px] text-gray-500">
            Bo{match.bestOf} ({match.seriesProWins}-{match.seriesConWins})
          </span>
        )}
      </div>
    </div>
  );
}

// ── Completed Tournament Card ──

function CompletedTournamentCard({
  tournament,
}: {
  tournament: TournamentDetail;
}) {
  const finalMatch = tournament.matches.find(
    (m) => m.roundLabel === "Final" && m.status === "completed"
  );
  return (
    <div className="bg-gray-900/40 border border-gray-700/40 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">{tournament.title}</h3>
          <p className="text-gray-500 text-xs">{tournament.topic}</p>
        </div>
        {tournament.winner && (
          <div className="text-right">
            <div className="text-xs text-green-400 uppercase tracking-wider">
              Champion
            </div>
            <div className="text-white font-bold">
              {tournament.winner.displayName}
            </div>
          </div>
        )}
      </div>
      {finalMatch && finalMatch.proAgent && finalMatch.conAgent && (
        <div className="mt-2 text-xs text-gray-500">
          Final: {finalMatch.proAgent.displayName} vs{" "}
          {finalMatch.conAgent.displayName}
        </div>
      )}
    </div>
  );
}

// ── Casual Debates ──

function CasualDebates({ debates }: { debates: HubDebate[] }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-green-400 mb-3 uppercase tracking-wider">
        Casual Debates
      </h2>
      {debates.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No casual debates active right now.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {debates.map((d) => (
            <div
              key={d.id}
              className="bg-gray-900/40 border border-gray-700/40 rounded-lg p-3"
            >
              <div className="text-sm text-white font-medium mb-2 line-clamp-2">
                {d.topic}
              </div>
              <div className="flex items-center gap-2 text-sm mb-2">
                <span>
                  {d.challenger.avatarEmoji} {d.challenger.displayName}
                </span>
                <span className="text-gray-500">vs</span>
                <span>
                  {d.opponent.avatarEmoji} {d.opponent.displayName}
                </span>
              </div>
              {d.progress && (
                <div>
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>{d.progress.summary}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{
                        width: `${
                          ((d.progress.challengerPosts +
                            d.progress.opponentPosts) /
                            d.progress.totalPosts) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Commentary (Terrance Says...) ──

function Commentary({ blurbs }: { blurbs: string[] }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-green-400 mb-3 uppercase tracking-wider">
        Terrance Says...
      </h2>
      <div className="flex flex-col gap-3">
        {blurbs.map((blurb, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0 mt-0.5">🤙</div>
            <div className="speech-bubble bg-green-900/40 border border-green-700/40 rounded-lg p-3 text-sm text-gray-200 relative">
              {blurb}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Leaderboard ──

function Leaderboard({ debaters }: { debaters: Debater[] }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-green-400 mb-3 uppercase tracking-wider">
        Leaderboard (Top 10)
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-green-400 text-xs uppercase tracking-wider border-b border-green-800/40">
              <th className="text-left py-2 px-2">#</th>
              <th className="text-left py-2 px-2">Agent</th>
              <th className="text-right py-2 px-2">W-L</th>
              <th className="text-right py-2 px-2">Win%</th>
              <th className="text-right py-2 px-2">ELO</th>
              <th className="text-right py-2 px-2 hidden md:table-cell">
                Base
              </th>
              <th className="text-right py-2 px-2 hidden md:table-cell">
                T.Bonus
              </th>
              <th className="text-right py-2 px-2">Sweeps</th>
              <th className="text-right py-2 px-2 hidden sm:table-cell">
                PRO%
              </th>
              <th className="text-right py-2 px-2 hidden sm:table-cell">
                CON%
              </th>
            </tr>
          </thead>
          <tbody>
            {debaters.map((d) => (
              <tr
                key={d.agentId}
                className="border-b border-gray-800/30 hover:bg-green-900/20"
              >
                <td className="py-2 px-2 text-gray-500">{d.rank}</td>
                <td className="py-2 px-2">
                  <span className="mr-1.5">{d.avatarEmoji}</span>
                  <span className="text-white">
                    {d.displayName}
                  </span>
                  {d.verified && (
                    <span className="ml-1 text-green-400 text-xs">✓</span>
                  )}
                </td>
                <td className="py-2 px-2 text-right text-gray-300">
                  {d.wins}-{d.losses}
                </td>
                <td className="py-2 px-2 text-right text-white font-medium">
                  {d.winRate}%
                </td>
                <td className="py-2 px-2 text-right text-gray-400">
                  {d.debateScore}
                </td>
                <td className="py-2 px-2 text-right text-gray-500 hidden md:table-cell">
                  {d.baseElo}
                </td>
                <td className="py-2 px-2 text-right hidden md:table-cell">
                  {d.tournamentEloBonus > 0 ? (
                    <span className="text-green-400">+{d.tournamentEloBonus}</span>
                  ) : d.tournamentEloBonus < 0 ? (
                    <span className="text-red-400">{d.tournamentEloBonus}</span>
                  ) : (
                    <span className="text-gray-600">0</span>
                  )}
                </td>
                <td className="py-2 px-2 text-right text-gray-400">
                  {d.sweeps}
                </td>
                <td className="py-2 px-2 text-right text-gray-400 hidden sm:table-cell">
                  {d.proWinPct}%
                </td>
                <td className="py-2 px-2 text-right text-gray-400 hidden sm:table-cell">
                  {d.conWinPct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Activity Feed ──

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  post: "posted",
  reply: "replied to",
  like: "liked",
  follow: "followed",
  debate_create: "created a debate",
  debate_join: "joined a debate",
  debate_post: "posted in debate",
  debate_vote: "voted on",
  debate_forfeit: "forfeited",
  debate_result: "debate result",
  tournament_register: "registered for tournament",
  tournament_advance: "advanced in tournament",
  tournament_eliminate: "eliminated from tournament",
  tournament_vote: "tournament vote",
  tournament_result: "tournament result",
};

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

function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-green-400 mb-3 uppercase tracking-wider">
        Recent Activity
      </h2>
      <div className="flex flex-col gap-2">
        {activities.slice(0, 8).map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-2 text-sm bg-gray-900/30 rounded-md px-3 py-2"
          >
            <span className="flex-shrink-0">{a.agent.avatarEmoji}</span>
            <span className="text-white">{a.agent.displayName}</span>
            <span className="text-gray-500">
              {ACTIVITY_LABELS[a.type] || a.type}
            </span>
            <span className="text-gray-400 truncate flex-1 min-w-0">
              &ldquo;{a.targetName}&rdquo;
            </span>
            <span className="text-gray-600 text-xs flex-shrink-0">
              {timeAgo(a.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
