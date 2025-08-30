// Tiebreaker logic for MtgLeague standings
// Implements the league tiebreaker rules:
// 1. Total legs played (participation)
// 2. Total points
// 3. Progressive leg removal (remove lowest scoring legs until tie is broken)
// 4. Playoff/agreement if still tied

export interface PlayerStanding {
  player_id: string;
  player_name: string;
  total_wins: number;
  total_draws: number;
  total_losses: number;
  total_points: number;
  legs_played: number;
  best_leg_ids: string[];
  leg_scores: { [legId: string]: { wins: number; draws: number; losses: number; points: number; participated: boolean } };
  rank?: number;
  tiebreaker_info?: TiebreakerInfo;
}

export interface TiebreakerInfo {
  tie_group_size: number;
  tiebreaker_steps: TiebreakerStep[];
  final_ranking: PlayerStanding[];
  tie_broken: boolean;
  legs_removed: number;
}

export interface TiebreakerStep {
  step: number;
  description: string;
  result: string;
}

// Calculate standings with tiebreakers
export function calculateStandingsWithTiebreakers(
  players: PlayerStanding[],
  bestLegsCount: number
): PlayerStanding[] {
  // First, sort by total points and legs played (existing logic)
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.total_points !== a.total_points) {
      return b.total_points - a.total_points;
    }
    return b.legs_played - a.legs_played;
  });

  // Group players by ties and apply tiebreakers
  const finalStandings: PlayerStanding[] = [];
  let currentRank = 1;
  let i = 0;

  while (i < sortedPlayers.length) {
    // Find the current tie group
    const tieGroup = findTieGroup(sortedPlayers, i, bestLegsCount);
    
    if (tieGroup.length === 1) {
      // No tie, just add the player
      finalStandings.push({
        ...tieGroup[0],
        rank: currentRank,
        tiebreaker_info: {
          tie_group_size: 1,
          tiebreaker_steps: [],
          final_ranking: [],
          tie_broken: false,
          legs_removed: 0
        }
      });
      currentRank++;
      i++;
    } else {
      // Apply tiebreakers to the group
      const tiebreakerResult = applyTiebreakersToGroup(tieGroup, bestLegsCount);
      
      // Add all players in the group with their tiebreaker info
      tieGroup.forEach(player => {
        finalStandings.push({
          ...player,
          rank: currentRank,
          tiebreaker_info: tiebreakerResult
        });
      });
      
      currentRank += tieGroup.length;
      i += tieGroup.length;
    }
  }

  return finalStandings;
}

// Find a group of tied players
function findTieGroup(
  players: PlayerStanding[],
  startIndex: number,
  bestLegsCount: number
): PlayerStanding[] {
  const group: PlayerStanding[] = [players[startIndex]];
  const startPlayer = players[startIndex];
  
  for (let i = startIndex + 1; i < players.length; i++) {
    const player = players[i];
    if (player.total_points === startPlayer.total_points && 
        player.legs_played === startPlayer.legs_played) {
      group.push(player);
    } else {
      break;
    }
  }
  
  return group;
}

// Apply tiebreakers to a group of tied players
function applyTiebreakersToGroup(
  players: PlayerStanding[],
  bestLegsCount: number
): TiebreakerInfo {
  const steps: TiebreakerStep[] = [];
  let legsRemoved = 0;
  let tieBroken = false;
  
  // Step 1: Check if tie is broken by legs played
  steps.push({
    step: 1,
    description: 'Tiebreaker 1: Total legs played',
    result: 'Tie not broken - all players have same number of legs played'
  });
  
  // Step 2: Progressive leg removal
  const maxLegs = Math.max(...players.map(p => p.legs_played));
  
  while (!tieBroken && legsRemoved < maxLegs - 1) {
    legsRemoved++;
    const currentRanking = getCurrentRanking(players, bestLegsCount, legsRemoved);
    
    if (currentRanking.length === 1) {
      tieBroken = true;
      steps.push({
        step: 2 + legsRemoved,
        description: `Tiebreaker ${2 + legsRemoved}: Remove ${legsRemoved} lowest scoring leg(s)`,
        result: 'Tie broken by progressive leg removal'
      });
    } else {
      steps.push({
        step: 2 + legsRemoved,
        description: `Tiebreaker ${2 + legsRemoved}: Remove ${legsRemoved} lowest scoring leg(s)`,
        result: 'Tie not broken - continue to next step'
      });
    }
  }
  
  // If tie still not broken, add final step
  if (!tieBroken) {
    steps.push({
      step: 2 + legsRemoved + 1,
      description: 'Final tiebreaker',
      result: 'Tie requires playoff or player agreement'
    });
  }
  
  const finalRanking = getCurrentRanking(players, bestLegsCount, legsRemoved);
  
  return {
    tie_group_size: players.length,
    tiebreaker_steps: steps,
    final_ranking: finalRanking,
    tie_broken: tieBroken,
    legs_removed: legsRemoved
  };
}

// Get current ranking after removing N lowest scoring legs
function getCurrentRanking(
  players: PlayerStanding[],
  bestLegsCount: number,
  legsToRemove: number
): PlayerStanding[] {
  const adjustedPlayers = players.map(player => {
    // Get all leg scores sorted by points (highest first)
    const legScores = Object.entries(player.leg_scores)
      .filter(([_, score]) => score.participated)
      .map(([legId, score]) => ({ legId, points: score.points }))
      .sort((a, b) => b.points - a.points);
    
    // Remove the lowest scoring legs
    const remainingLegs = legScores.slice(0, Math.max(0, bestLegsCount - legsToRemove));
    const adjustedPoints = remainingLegs.reduce((sum, leg) => sum + leg.points, 0);
    
    return {
      ...player,
      total_points: adjustedPoints
    };
  });
  
  // Sort by adjusted points
  return adjustedPlayers.sort((a, b) => b.total_points - a.total_points);
}

// Format tiebreaker information for display
export function formatTiebreakerInfo(tiebreakerInfo: TiebreakerInfo): string {
  if (tiebreakerInfo.tie_group_size === 1) {
    return '';
  }
  
  const lastStep = tiebreakerInfo.tiebreaker_steps[tiebreakerInfo.tiebreaker_steps.length - 1];
  if (lastStep.result.includes('Tie broken')) {
    return `Tie broken by ${lastStep.description.toLowerCase()}`;
  } else if (lastStep.result.includes('playoff')) {
    return 'Tie requires playoff or player agreement';
  } else {
    return 'Tie not broken by available tiebreakers';
  }
} 