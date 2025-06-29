import React from 'react';
import { BracketMatch, BracketMatchData } from './BracketMatch';

export interface Top8BracketProps {
  matches: {
    qf: BracketMatchData[]; // 4
    sf: BracketMatchData[]; // 2
    final: BracketMatchData[]; // 1
  };
}

export function Top8Bracket({ matches }: Top8BracketProps) {
  return (
    <div className="bracket-container">
      <div className="bracket-column">
        <BracketMatch match={matches.qf[0]} />
        <BracketMatch match={matches.qf[1]} />
        <BracketMatch match={matches.qf[2]} />
        <BracketMatch match={matches.qf[3]} />
      </div>
      <div className="bracket-column bracket-column-center">
        <div className="bracket-spacer" />
        <BracketMatch match={matches.sf[0]} />
        <div className="bracket-spacer" />
        <BracketMatch match={matches.sf[1]} />
        <div className="bracket-spacer" />
      </div>
      <div className="bracket-column">
        <div className="bracket-spacer" />
        <div className="bracket-spacer" />
        <BracketMatch match={matches.final[0]} />
        <div className="bracket-spacer" />
        <div className="bracket-spacer" />
      </div>
    </div>
  );
} 