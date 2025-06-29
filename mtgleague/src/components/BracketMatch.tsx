import React from 'react';

export interface BracketPlayer {
  name: string;
  visibility?: 'public' | 'private';
}

export interface BracketMatchData {
  id?: string;
  player1?: BracketPlayer;
  player2?: BracketPlayer;
  score1?: number;
  score2?: number;
  winner?: 1 | 2;
  result?: string;
  winner_player?: BracketPlayer;
  round?: 'qf' | 'sf' | 'final';
}

export function BracketMatch({ match }: { match?: BracketMatchData }) {
  if (!match) return <div className="bracket-match">TBD</div>;

  const getPlayerDisplayName = (player?: BracketPlayer): string => {
    if (!player) return "TBD";
    return player.visibility === 'private' ? 'Anonymous' : player.name;
  };

  const getScore1 = (): string => {
    if (!match.result) return "";
    return match.result.split('-')[0] || "";
  };

  const getScore2 = (): string => {
    if (!match.result) return "";
    return match.result.split('-')[1] || "";
  };

  const isWinner = (playerNum: 1 | 2): boolean => {
    if (match.winner === playerNum) return true;
    if (match.winner_player && playerNum === 1 && match.player1?.name === match.winner_player.name) return true;
    if (match.winner_player && playerNum === 2 && match.player2?.name === match.winner_player.name) return true;
    return false;
  };

  const isFinal = match.round === 'final';
  const matchClassName = isFinal 
    ? "bracket-match bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700" 
    : "bracket-match";

  return (
    <div className={matchClassName}>
      <div className="space-y-1">
        {isFinal && (
          <div className="text-xs font-bold text-yellow-700 dark:text-yellow-300 mb-2">
            🏆 CHAMPIONSHIP
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className={isWinner(1) ? "font-bold" : ""}>
            {getPlayerDisplayName(match.player1)}
          </span>
          <span className="font-medium">{getScore1()}</span>
        </div>
        <div className="text-xs text-muted-foreground">vs</div>
        <div className="flex justify-between items-center">
          <span className={isWinner(2) ? "font-bold" : ""}>
            {getPlayerDisplayName(match.player2)}
          </span>
          <span className="font-medium">{getScore2()}</span>
        </div>
      </div>
      {match.result && (match.winner_player || match.winner) && (
        <div className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
          {isFinal ? "🏆 Champion: " : "Winner: "}
          {getPlayerDisplayName(match.winner_player || (match.winner === 1 ? match.player1 : match.player2))}
        </div>
      )}
    </div>
  );
} 