'use client'

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Top8Bracket, Top8BracketProps } from '@/components/Top8Bracket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Loader2, RefreshCw } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface Season {
  id: string;
  name: string;
  total_legs: number;
  best_legs_count: number;
  status: 'active' | 'completed';
  created_at: string;
  completed_at?: string;
}

interface Leg {
  id: string;
  name: string;
  round_number: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  created_at: string;
  completed_at?: string;
}

interface PlayerStanding {
  player_id: string;
  player_name: string;
  player_visibility: 'public' | 'private';
  total_wins: number;
  total_draws: number;
  total_losses: number;
  total_points: number;
  legs_played: number;
  leg_scores: { [legId: string]: { wins: number; draws: number; losses: number; points: number; participated: boolean } };
  best_leg_ids: string[];
}

interface LegResultWithPlayer {
  player_id: string;
  players: { name: string; visibility: 'public' | 'private' };
  leg_id: string;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  participated: boolean;
}

export default function PublicSeasonStandingsPage() {
  const params = useParams();
  const router = useRouter();
  const seasonId = params.seasonId as string;
  const [season, setSeason] = useState<Season | null>(null);
  const [legs, setLegs] = useState<Leg[]>([]);
  const [standings, setStandings] = useState<PlayerStanding[]>([]);
  const [matches, setMatches] = useState<Top8BracketProps['matches']>({ qf: [], sf: [], final: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);

  const loadData = async () => {
    if (!seasonId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch season
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .eq('id', seasonId)
        .single();
        
      if (seasonError || !seasonData) {
        setError('Failed to load season');
        setLoading(false);
        return;
      }
      
      setSeason(seasonData);
      setStoreId(seasonData.store_id);

      // Load legs for this season
      const { data: legsData, error: legsError } = await supabase
        .from('legs')
        .select('*')
        .eq('season_id', seasonId)
        .order('round_number', { ascending: true });

      if (legsError) {
        console.error('Error loading legs:', legsError);
        setError('Failed to load season data');
        setLoading(false);
        return;
      }

      const legsList = legsData || [];
      setLegs(legsList);

      // Load standings with season data
      const standingsData = await loadStandings(seasonId, legsList, seasonData.best_legs_count);
      setStandings(standingsData);

      // Load Top 8 data for completed seasons
      if (seasonData.status === 'completed') {
        const { data: top8Data, error: top8Error } = await supabase
          .from('top8s')
          .select('*')
          .eq('season_id', seasonId)
          .eq('status', 'completed')
          .single();

        if (!top8Error && top8Data) {
          // Load Top 8 matches
          const { data: matchesData, error: matchesError } = await supabase
            .from('top8_matches')
            .select('*')
            .eq('top8_id', top8Data.id)
            .order('round', { ascending: true })
            .order('ordinal', { ascending: true });

          if (!matchesError && matchesData) {
            // Load player data separately to avoid foreign key issues
            const playerIds = new Set<string>();
            matchesData.forEach((match: any) => {
              if (match.player1_id) playerIds.add(match.player1_id);
              if (match.player2_id) playerIds.add(match.player2_id);
              if (match.winner_id) playerIds.add(match.winner_id);
            });

            let playersData: { [key: string]: { name: string; visibility: 'public' | 'private' } } = {};
            if (playerIds.size > 0) {
              const { data: players, error: playersError } = await supabase
                .from('players')
                .select('id, name, visibility')
                .in('id', Array.from(playerIds));

              if (!playersError && players) {
                players.forEach((player: any) => {
                  playersData[player.id] = { name: player.name, visibility: player.visibility };
                });
              }
            }

            // Combine matches with player data
            const matchesWithPlayers = matchesData.map((match: any) => ({
              ...match,
              player1: match.player1_id ? playersData[match.player1_id] : null,
              player2: match.player2_id ? playersData[match.player2_id] : null,
              winner: match.winner_id ? playersData[match.winner_id] : null,
            }));

            // Group matches by round
            const qf = matchesWithPlayers.filter((m: any) => m.round === 'qf');
            const sf = matchesWithPlayers.filter((m: any) => m.round === 'sf');
            const final = matchesWithPlayers.filter((m: any) => m.round === 'final');
            setMatches({ qf, sf, final });
          }
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load season data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [seasonId]);

  const loadStandings = async (seasonId: string, legsList: Leg[], bestLegsCount: number): Promise<PlayerStanding[]> => {
    try {
      // Check if we have legs to query
      if (legsList.length === 0) {
        console.log('No legs found for season:', seasonId);
        return [];
      }

      // Filter to only completed legs since anonymous users can only access completed leg results
      const completedLegs = legsList.filter(leg => leg.status === 'completed');
      
      if (completedLegs.length === 0) {
        console.log('No completed legs found for season:', seasonId);
        return [];
      }

      console.log('Loading standings for season:', seasonId, 'with completed legs:', completedLegs.map(l => l.id), 'best legs count:', bestLegsCount);

      // First, get the store ID from the season
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('store_id')
        .eq('id', seasonId)
        .single();

      if (seasonError || !seasonData) {
        console.error('Error loading season:', seasonError);
        return [];
      }

      // Get all players from the store (not just those who participated)
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, name, visibility')
        .eq('store_id', seasonData.store_id);

      if (playersError) {
        console.error('Error loading players:', playersError);
        return [];
      }

      console.log('All players loaded:', players?.length || 0, 'players');

      // Get all leg results for completed legs in this season
      const { data: allResults, error: resultsError } = await supabase
        .from('leg_results')
        .select(`
          player_id,
          wins,
          draws,
          losses,
          points,
          participated,
          leg_id
        `)
        .in('leg_id', completedLegs.map(leg => leg.id));

      if (resultsError) {
        console.error('Error loading leg results:', resultsError);
        return [];
      }

      console.log('All leg results loaded:', allResults?.length || 0, 'results');

      // Calculate standings
      const standingsMap = new Map<string, PlayerStanding>();

      // Initialize all players
      players?.forEach(player => {
        standingsMap.set(player.id, {
          player_id: player.id,
          player_name: player.name,
          player_visibility: player.visibility,
          total_wins: 0,
          total_draws: 0,
          total_losses: 0,
          total_points: 0,
          legs_played: 0,
          leg_scores: {},
          best_leg_ids: []
        });
      });

      // Process results by leg
      completedLegs.forEach(leg => {
        const legResults = allResults?.filter(r => r.leg_id === leg.id) || [];

        console.log(`Results for leg ${leg.id}:`, legResults.length, 'results');

        legResults.forEach(result => {
          const standing = standingsMap.get(result.player_id);
          if (standing) {
            standing.total_wins += result.wins || 0;
            standing.total_draws += result.draws || 0;
            standing.total_losses += result.losses || 0;
            standing.total_points += result.points || 0;
            if (result.participated) {
              standing.legs_played += 1;
            }

            // Store individual leg scores
            standing.leg_scores[leg.id] = {
              wins: result.wins || 0,
              draws: result.draws || 0,
              losses: result.losses || 0,
              points: result.points || 0,
              participated: result.participated || false
            };
          }
        });
      });

      // Convert to array and apply best N results calculation
      const standingsArray = Array.from(standingsMap.values())
        .map(standing => {
          // Calculate best N results for this player
          const bestResults = calculateBestNResults(standing.leg_scores, bestLegsCount);
          
          return {
            ...standing,
            total_wins: bestResults.totalWins,
            total_draws: bestResults.totalDraws,
            total_losses: bestResults.totalLosses,
            total_points: bestResults.totalPoints,
            best_leg_ids: bestResults.bestLegIds
          };
        })
        .sort((a, b) => b.total_points - a.total_points);

      console.log('Calculated standings:', standingsArray.length, 'players');
      return standingsArray;

    } catch (error) {
      console.error('Error loading standings:', error);
      return [];
    }
  };

  const calculateBestNResults = (
    legScores: { [legId: string]: { wins: number; draws: number; losses: number; points: number; participated: boolean } },
    bestLegsCount: number
  ): { bestLegIds: string[]; totalPoints: number; totalWins: number; totalDraws: number; totalLosses: number } => {
    // Convert to array of { legId, points } and sort by points descending
    const legResults = Object.entries(legScores)
      .map(([legId, score]) => ({
        legId,
        points: score.participated ? score.points : 0,
        participated: score.participated
      }))
      .sort((a, b) => b.points - a.points);

    // Take the best N results
    const bestResults = legResults.slice(0, bestLegsCount);
    const bestLegIds = bestResults.map(result => result.legId);

    // Calculate totals from best results
    const totalPoints = bestResults.reduce((sum, result) => sum + result.points, 0);
    
    let totalWins = 0;
    let totalDraws = 0;
    let totalLosses = 0;
    
    bestLegIds.forEach(legId => {
      const score = legScores[legId];
      if (score.participated) {
        totalWins += score.wins || 0;
        totalDraws += score.draws || 0;
        totalLosses += score.losses || 0;
      }
    });

    return {
      bestLegIds,
      totalPoints,
      totalWins,
      totalDraws,
      totalLosses
    };
  };

  const getPlayerDisplayName = (playerName: string, visibility: 'public' | 'private'): string => {
    // For anonymous users, show "Anonymous" for private players
    // Deleted players already have "Deleted Player" as their name in the database
    return visibility === 'private' ? 'Anonymous' : playerName;
  };

  const getPlayerScoreForLeg = (playerId: string, legId: string): string => {
    const standing = standings.find(s => s.player_id === playerId);
    if (!standing || !standing.leg_scores[legId]) {
      return '-';
    }
    const legScore = standing.leg_scores[legId];
    if (!legScore.participated) {
      return 'DNP';
    }
    return legScore.points.toString();
  };

  const isBestResult = (legId: string, bestLegIds: string[]): boolean => {
    return bestLegIds.includes(legId);
  };

  const getLegStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-600">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-600">In Progress</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Reload the data
    if (seasonId) {
      await loadData();
    }
    setRefreshing(false);
  };

  const handleChangeStore = () => {
    localStorage.removeItem('selectedStoreId');
    router.push('/');
  };

  const handleBackToStore = () => {
    if (storeId) {
      router.push(`/store/${storeId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading season standings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">Season not found</p>
        </div>
      </div>
    );
  }

  const completedLegs = legs.filter(leg => leg.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Trophy className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">MtgLeague</span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {storeId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToStore}
                >
                  Back to Store
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleChangeStore}
              >
                Change Store
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-1"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/login')}
              >
                Admin Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Season Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>{season.name} - Final Standings</span>
                <Badge variant={season.status === 'completed' ? 'outline' : 'default'} className={season.status === 'completed' ? 'text-green-600' : 'bg-green-600'}>
                  {season.status === 'completed' ? 'Completed' : 'Active'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Best {season.best_legs_count} results from completed legs
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Standings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Final Standings</CardTitle>
            </CardHeader>
            <CardContent>
              {legs.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No legs available for this season</p>
                </div>
              ) : standings.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No completed legs yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-48">Player</TableHead>
                        {completedLegs.map((leg) => (
                          <TableHead key={leg.id} className="text-center">
                            <div className="space-y-1">
                              <div className="font-medium">Round {leg.round_number}</div>
                              {getLegStatusBadge(leg.status)}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center font-bold">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings.map((standing, index) => (
                        <TableRow key={standing.player_id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">#{index + 1}</span>
                              <span>{getPlayerDisplayName(standing.player_name, standing.player_visibility)}</span>
                            </div>
                          </TableCell>
                          {completedLegs.map((leg) => (
                            <TableCell 
                              key={leg.id} 
                              className={`text-center text-sm ${
                                isBestResult(leg.id, standing.best_leg_ids) 
                                  ? 'bg-green-50 dark:bg-green-900/20 font-semibold text-green-700 dark:text-green-300' 
                                  : ''
                              }`}
                            >
                              {getPlayerScoreForLeg(standing.player_id, leg.id)}
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-bold">
                            <div className="space-y-1">
                              <div>{standing.total_points} pts</div>
                              <div className="text-xs text-gray-500">
                                {standing.legs_played} legs
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top 8 Bracket */}
          {season.status === 'completed' && (matches.qf.length > 0 || matches.sf.length > 0 || matches.final.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Top 8 Tournament</CardTitle>
              </CardHeader>
              <CardContent>
                <Top8Bracket matches={matches} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 