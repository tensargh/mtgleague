'use client'

console.log('TO SEASON PAGE RENDERED');

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Top8Bracket, Top8BracketProps } from '@/components/Top8Bracket';
import { useParams } from 'next/navigation';

export default function SeasonPage() {
  // Placeholder: In your real app, fetch and set this from Supabase or props
  const [season, setSeason] = useState<any>(null);
  const [matches, setMatches] = useState<Top8BracketProps['matches']>({ qf: [], sf: [], final: [] });
  const params = useParams();
  const seasonId = params.seasonId as string;

  useEffect(() => {
    // Example: Fetch season data (replace with your real logic)
    async function fetchSeason() {
      const { data: seasonData } = await supabase.from('seasons').select('*').eq('id', seasonId).single();
      setSeason(seasonData);
    }
    fetchSeason();
  }, [seasonId]);

  useEffect(() => {
    // Fetch top8 matches if season is completed
    if (season?.status === 'completed') {
      (async () => {
        const { data: top8s } = await supabase.from('top8s').select('id').eq('season_id', season.id).single();
        if (top8s?.id) {
          const { data: matchesData } = await supabase.from('top8_matches').select('*').eq('top8_id', top8s.id);
          console.log('Fetched matchesData:', matchesData);
          if (matchesData && matchesData.length > 0) {
            // Gather all player IDs
            const playerIds = new Set();
            matchesData.forEach((match) => {
              if (match.player1_id) playerIds.add(match.player1_id);
              if (match.player2_id) playerIds.add(match.player2_id);
              if (match.winner_id) playerIds.add(match.winner_id);
            });
            let playersData: Record<string, { name: string; visibility: 'public' | 'private' }> = {};
            if (playerIds.size > 0) {
              const { data: players, error: playersError } = await supabase
                .from('players')
                .select('id, name, visibility')
                .in('id', Array.from(playerIds));
              console.log('Fetched playersData:', players);
              if (!playersError && players) {
                players.forEach((player) => {
                  playersData[player.id] = { name: player.name, visibility: player.visibility };
                });
              }
            }
            // Map matches to include player objects
            const matchesWithPlayers = matchesData.map((match) => ({
              ...match,
              player1: match.player1_id ? playersData[match.player1_id] : null,
              player2: match.player2_id ? playersData[match.player2_id] : null,
              winner: match.winner_id ? playersData[match.winner_id] : null,
            }));
            console.log('Mapped matchesWithPlayers:', matchesWithPlayers);
            const qf = matchesWithPlayers.filter((m) => m.round === 'qf');
            const sf = matchesWithPlayers.filter((m) => m.round === 'sf');
            const final = matchesWithPlayers.filter((m) => m.round === 'final');
            setMatches({ qf, sf, final });
          } else {
            console.log('No matches found for this top8.');
            setMatches({ qf: [], sf: [], final: [] });
          }
        } else {
          console.log('No top8s found for this season.');
        }
      })();
    }
  }, [season]);

  return (
    <div className="space-y-8">
      {/* Standings Table */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Season Standings</h2>
        {/* TODO: Replace with your actual standings table component or logic */}
        <div className="border rounded p-4 text-gray-500">[Standings Table Here]</div>
      </div>

      {/* Top 8 Bracket (read-only, public/anonymous style) */}
      {season?.status === 'completed' && (matches.qf.length > 0 || matches.sf.length > 0 || matches.final.length > 0) && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Top 8 Bracket</h2>
          <Top8Bracket matches={matches} />
        </div>
      )}

      {/* Round Results */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Round Results</h2>
        {/* TODO: Replace with your actual round results component or logic */}
        <div className="border rounded p-4 text-gray-500">[Round Results Here]</div>
      </div>
    </div>
  );
} 