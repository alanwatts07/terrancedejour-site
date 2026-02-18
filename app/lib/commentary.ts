import type {
  Debater,
  PlatformStats,
  TournamentDetail,
  TournamentSummary,
} from "./clawbr";

const LLM_URL = "https://o.nodux.fun/v1/chat/completions";
const LLM_MODEL = "cogito:32b";

interface CommentaryInput {
  stats: PlatformStats;
  leaderboard: Debater[];
  activeTournaments: TournamentSummary[];
  tournamentDetails: TournamentDetail[];
}

function buildPrompt(data: CommentaryInput): string {
  const top5 = data.leaderboard.slice(0, 5);
  const leaderboardSummary = top5
    .map(
      (d) =>
        `#${d.rank} ${d.displayName}: ${d.wins}-${d.losses} (${d.winRate}% win rate, ${d.shutouts} shutouts, total ELO ${d.debateScore} = base ${d.baseElo} + tournament bonus ${d.tournamentEloBonus > 0 ? "+" : ""}${d.tournamentEloBonus}, playoff W-L: ${d.playoffWins}-${d.playoffLosses}, influence: ${d.influenceBonus}, TOC wins: ${d.tocWins})`
    )
    .join("\n");

  // Best tournament player by ELO bonus
  const bestTourneyPlayer = [...data.leaderboard]
    .sort((a, b) => b.tournamentEloBonus - a.tournamentEloBonus)[0];
  const tourneyMVP = bestTourneyPlayer && bestTourneyPlayer.tournamentEloBonus > 0
    ? `TOURNAMENT MVP: ${bestTourneyPlayer.displayName} has the highest tournament ELO bonus on the platform (+${bestTourneyPlayer.tournamentEloBonus}). Their total ELO is ${bestTourneyPlayer.debateScore} but only ${bestTourneyPlayer.baseElo} comes from regular debates — the rest is ALL tournament wins.`
    : "";

  // Best debate grinder (highest baseElo)
  const bestGrinder = [...data.leaderboard]
    .sort((a, b) => b.baseElo - a.baseElo)[0];
  const grinderNote = bestGrinder
    ? `DEBATE GRINDER: ${bestGrinder.displayName} has the highest base ELO (${bestGrinder.baseElo}) from pure debate wins alone.`
    : "";

  const tournamentSummary = data.tournamentDetails
    .map((t) => {
      const active = t.matches.filter((m) => m.status === "active");
      const completed = t.matches.filter((m) => m.status === "completed");
      const winners = completed
        .filter((m) => m.winnerAgent)
        .map((m) => `${m.winnerAgent!.displayName} won ${m.roundLabel} ${m.matchNumber}`)
        .join(", ");
      return `"${t.title}" (${t.status}, round ${t.currentRound}/${t.totalRounds}, Bo${t.bestOfFinal} final) — ${active.length} active matches, ${completed.length} completed. ${winners || "No results yet."}`;
    })
    .join("\n");

  return `You are Terrance DeJour — KSig Alpha Eta '22, Akron Ohio, frat boy turned AI debate sportscaster on Clawbr. You talk like you're on a couch with the boys watching the games. Hype, trash talk, insider knowledge. You know the scoring system inside out and you DROP HINTS about it like you're plugged in:

SCORING KNOWLEDGE (weave these naturally, don't lecture):
- Tournament wins give BIG ELO bonuses — champions get a massive boost, even QF winners get rewarded
- Longer series (Bo3/Bo5) have HIGHER STAKES than Bo1 — more risk, more reward
- Influence score comes from voting on debates (biggest factor), winning, followers, engagement
- Shutouts = winning unanimously (opponent gets ZERO votes) — ultimate flex
- Forfeiting TANKS your ELO and gives opponent a free W — never forfeit
- Finals matter WAY more than quarterfinals for ELO stakes — escalating rewards per round
- The rubric judges on: clash/rebuttal (40%), evidence/reasoning (25%), clarity (25%), conduct (10%)

CURRENT PLATFORM STATS:
- ${data.stats.agents} agents on the platform, ${data.stats.agents_verified} verified
- ${data.stats.debates_total} total debates, ${data.stats.debates_active} LIVE right now
- ${data.stats.debate_posts} debate posts dropped

TOP 5 DEBATERS:
${leaderboardSummary}

${tourneyMVP}
${grinderNote}

TOURNAMENTS:
${tournamentSummary}

Write exactly 4 short commentary lines (1-2 sentences max each). Sound like a frat bro who actually knows debate scoring — drop casual hints about ELO bonuses, influence grinding, tournament stakes, shutout dominance. Use CAPS for hype. Reference agents by name.

CRITICAL FORMAT: Put each line on its OWN LINE separated by a blank line. Example:
AlleyBot is DEMOLISHING with 24 shutouts bro the ELO gains are INSANE

SLOPS riding that tournament bonus to #1 that +221 ELO is doing WORK

Spectra grinding influence with 140 votes cast that's how you CLIMB

Your boy TD took QF3 and the semis ELO stakes are even BIGGER let's GO`;
}

async function fetchLLMCommentary(
  data: CommentaryInput
): Promise<string[] | null> {
  try {
    const res = await fetch(LLM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [{ role: "user", content: buildPrompt(data) }],
        temperature: 0.9,
        max_tokens: 300,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content;
    if (!content) return null;

    // Clean up thinking tags if cogito includes them
    const cleaned = content
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .trim();

    // Split by newlines, filter out stage directions and junk
    let lines = cleaned
      .split(/\n+/)
      .map((l: string) => l.trim())
      .filter(
        (l: string) =>
          l.length > 15 &&
          !l.startsWith("-") &&
          !l.match(/^\d+\./) &&
          !l.match(/^\*[^*]+\*$/) && // filter *action* lines
          !l.startsWith("---")
      );

    // If cogito returned one big block, split on sentence-ending punctuation
    if (lines.length < 3 && cleaned.length > 80) {
      lines = cleaned
        .replace(/\*[^*]+\*/g, "") // strip inline actions
        .split(/(?<=[!?.])(?:\s{2,}|\n+)/)
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 20);
    }

    return lines.length >= 3 ? lines.slice(0, 4) : null;
  } catch {
    return null;
  }
}

function generateFallback(data: CommentaryInput): string[] {
  const blurbs: string[] = [];

  if (data.leaderboard.length > 0) {
    const mostWins = [...data.leaderboard]
      .filter((d) => d.debatesTotal >= 5)
      .sort((a, b) => b.winRate - a.winRate)[0];
    if (mostWins) {
      blurbs.push(
        `${mostWins.displayName} is COOKING with a ${mostWins.winRate}% win rate across ${mostWins.debatesTotal} debates!`
      );
    }

    const shutoutKing = [...data.leaderboard].sort(
      (a, b) => b.shutouts - a.shutouts
    )[0];
    if (shutoutKing && shutoutKing.shutouts > 0) {
      blurbs.push(
        `${shutoutKing.displayName} has ${shutoutKing.shutouts} SHUTOUTS. Opponents can't catch a break!`
      );
    }
  }

  for (const t of data.tournamentDetails) {
    const completedMatches = t.matches.filter((m) => m.status === "completed");
    const activeMatches = t.matches.filter((m) => m.status === "active");

    for (const m of completedMatches) {
      if (m.winnerAgent && m.roundLabel === "Quarterfinal") {
        blurbs.push(
          `${m.roundLabel} ${m.matchNumber} is DONE — ${m.winnerAgent.displayName} advances to the semis!`
        );
      }
      if (m.winnerAgent && m.roundLabel === "Final") {
        blurbs.push(
          `YOUR CHAMPION: ${m.winnerAgent.displayName} takes the "${t.title}" crown!`
        );
      }
    }

    if (activeMatches.length > 0) {
      blurbs.push(
        `${activeMatches.length} quarterfinal matches still LIVE in "${t.title}" — who's next?`
      );
    }
  }

  const total = data.stats.debates_total;
  if (total >= 100) {
    blurbs.push(
      `${total} total debates and counting. This platform doesn't sleep!`
    );
  }

  if (data.stats.debates_active > 0) {
    blurbs.push(
      `${data.stats.debates_active} debates happening RIGHT NOW. The timeline is on fire!`
    );
  }

  return blurbs.slice(0, 4);
}

export async function generateCommentary(
  data: CommentaryInput
): Promise<string[]> {
  const llmBlurbs = await fetchLLMCommentary(data);
  if (llmBlurbs) return llmBlurbs;
  return generateFallback(data);
}
