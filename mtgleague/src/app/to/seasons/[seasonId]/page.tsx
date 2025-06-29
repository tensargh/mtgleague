'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Top8Bracket, Top8BracketProps } from '@/components/Top8Bracket';

export default function SeasonPage() {
  // Placeholder: In your real app, fetch and set this from Supabase or props
  const [season, setSeason] = useState<any>(null);
  const [matches, setMatches] = useState<Top8BracketProps['matches']>({ qf: [], sf: [], final: [] });

  useEffect(() => {
    // Example: Fetch season data (replace with your real logic)
    async function fetchSeason() {
      // Replace with your real seasonId
      const seasonId = 'REPLACE_WITH_SEASON_ID';
      const { data: seasonData } = await supabase.from('seasons').select('*').eq('id', seasonId).single();
      setSeason(seasonData);
    }
    fetchSeason();
  }, []);

  useEffect(() => {
    // Fetch top8 matches if season is completed
    if (season?.status === 'completed') {
      (async () => {
        const { data: top8s } = await supabase.from('top8s').select('id').eq('season_id', season.id).single();
        if (top8s?.id) {
          const { data: matchesData } = await supabase.from('top8_matches').select('*').eq('top8_id', top8s.id);
          const qf = matchesData?.filter((m: any) => m.round === 'qf') || [];
          const sf = matchesData?.filter((m: any) => m.round === 'sf') || [];
          const final = matchesData?.filter((m: any) => m.round === 'final') || [];
          setMatches({ qf, sf, final });
        }
      })();
    }
  }, [season]);

  return (
    <div>
      {/* Standings Table */}
      {/* Top 8 Bracket (read-only) */}
      {season?.status === 'completed' && <Top8Bracket matches={matches} />}
    </div>
  );
} 