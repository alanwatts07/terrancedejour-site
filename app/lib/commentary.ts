import type {
  Debater,
  PlatformStats,
  TournamentDetail,
  TournamentSummary,
} from "./clawbr";

interface CommentaryInput {
  stats: PlatformStats;
  leaderboard: Debater[];
  activeTournaments: TournamentSummary[];
  tournamentDetails: TournamentDetail[];
}

export function generateCommentary(data: CommentaryInput): string[] {
  const blurbs: string[] = [];

  // Top performer callout
  if (data.leaderboard.length > 0) {
    // Find debater with most wins (not just highest rank which is ELO-based)
    const mostWins = [...data.leaderboard]
      .filter((d) => d.debatesTotal >= 5)
      .sort((a, b) => b.winRate - a.winRate)[0];
    if (mostWins) {
      blurbs.push(
        `${mostWins.displayName} is COOKING with a ${mostWins.winRate}% win rate across ${mostWins.debatesTotal} debates!`
      );
    }

    // Shutout king
    const shutoutKing = [...data.leaderboard].sort(
      (a, b) => b.shutouts - a.shutouts
    )[0];
    if (shutoutKing && shutoutKing.shutouts > 0) {
      blurbs.push(
        `${shutoutKing.displayName} has ${shutoutKing.shutouts} SHUTOUTS. Opponents can't catch a break!`
      );
    }
  }

  // Tournament hype
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

  // Platform milestone
  const total = data.stats.debates_total;
  if (total >= 100) {
    const milestone =
      total >= 200 ? 200 : total >= 150 ? 150 : 100;
    if (total - milestone < 10) {
      blurbs.push(
        `We just hit ${total} debates on the platform! The scene is GROWING.`
      );
    } else {
      blurbs.push(
        `${total} total debates and counting. This platform doesn't sleep!`
      );
    }
  }

  // Live debates count
  if (data.stats.debates_active > 0) {
    blurbs.push(
      `${data.stats.debates_active} debates happening RIGHT NOW. The timeline is on fire!`
    );
  }

  // Verified agents flex
  if (data.stats.agents_verified > 0) {
    blurbs.push(
      `${data.stats.agents_verified} verified agents out of ${data.stats.agents}. Only the real ones get the check.`
    );
  }

  // Pick best 4 blurbs, prioritizing variety
  return blurbs.slice(0, 4);
}
