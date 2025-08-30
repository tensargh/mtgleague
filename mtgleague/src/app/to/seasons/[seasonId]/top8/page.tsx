'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Trophy, Users, Loader2, Save, Play, CheckCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Season {
  id: string
  name: string
  store_id: string
  status: 'active' | 'completed'
  best_legs_count: number
}

interface Store {
  id: string
  name: string
}

interface Player {
  id: string
  name: string
  visibility: 'public' | 'private'
}

interface PlayerStanding {
  player_id: string
  player_name: string
  player_visibility: 'public' | 'private'
  total_wins: number
  total_draws: number
  total_losses: number
  total_points: number
  legs_played: number
  rank: number
  leg_scores: { [legId: string]: { wins: number; draws: number; losses: number; points: number; participated: boolean } }
  best_leg_ids: string[]
}

interface Top8 {
  id: string
  season_id: string
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
  completed_at?: string
}

interface Top8Match {
  id: string
  top8_id: string
  player1_id?: string
  player2_id?: string
  round: 'qf' | 'sf' | 'final'
  result?: '2-0' | '2-1' | '1-2' | '0-2'
  winner_id?: string
  ordinal: number
  player1?: Player
  player2?: Player
  winner?: Player
}

export default function Top8Page() {
  const router = useRouter()
  const params = useParams()
  const seasonId = params.seasonId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [season, setSeason] = useState<Season | null>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [standings, setStandings] = useState<PlayerStanding[]>([])
  const [top8, setTop8] = useState<Top8 | null>(null)
  const [matches, setMatches] = useState<Top8Match[]>([])
  const [allSeasonPlayers, setAllSeasonPlayers] = useState<Player[]>([])
  const [dbError, setDbError] = useState<string | null>(null)
  const [legs, setLegs] = useState<{ id: string; round_number: number; status: string; round: string }[]>([])

  useEffect(() => {
    if (seasonId) {
      loadData()
    }
  }, [seasonId])

  // Debug logging for matches
  useEffect(() => {
    console.log('Current matches state:', matches)
  }, [matches])

  const loadData = async () => {
    try {
      setLoading(true)

      // Get user's store assignment
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      // Load season information
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .eq('id', seasonId)
        .single()

      if (seasonError || !seasonData) {
        toast.error('Season not found')
        router.push('/to/seasons')
        return
      }

      setSeason(seasonData)

      // Load store information
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', seasonData.store_id)
        .single()

      if (storeError || !storeData) {
        toast.error('Store not found')
        return
      }

      setStore(storeData)
      setDbError(null) // Clear any previous database errors

      // Load season standings
      const standingsData = await loadStandings(seasonId)
      setStandings(standingsData)

      // Load all season players for selection (including deleted ones for TO view)
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('store_id', storeData.id)
        .order('name', { ascending: true })

      if (playersError) {
        console.error('Error loading players:', playersError)
        toast.error('Failed to load players')
        return
      }

      setAllSeasonPlayers(playersData || [])

      // Load existing top8 if it exists
      try {
        const { data: top8Data, error: top8Error } = await supabase
          .from('top8s')
          .select('*')
          .eq('season_id', seasonId)
          .single()

        if (!top8Error && top8Data) {
          setTop8(top8Data)
          
          // Load top8 matches (without foreign key relationships)
          const { data: matchesData, error: matchesError } = await supabase
            .from('top8_matches')
            .select('*')
            .eq('top8_id', top8Data.id)
            .order('round', { ascending: true })
            .order('ordinal', { ascending: true })

          if (!matchesError && matchesData) {
            // Load player data separately to avoid foreign key issues
            const playerIds = new Set<string>()
            matchesData.forEach(match => {
              if (match.player1_id) playerIds.add(match.player1_id)
              if (match.player2_id) playerIds.add(match.player2_id)
              if (match.winner_id) playerIds.add(match.winner_id)
            })

            let playersData: { [key: string]: Player } = {}
            if (playerIds.size > 0) {
              const { data: players, error: playersError } = await supabase
                .from('players')
                .select('id, name, visibility')
                .in('id', Array.from(playerIds))

              if (!playersError && players) {
                players.forEach(player => {
                  playersData[player.id] = player
                })
              }
            }

            // Combine matches with player data
            const matchesWithPlayers = matchesData.map(match => ({
              ...match,
              player1: match.player1_id ? playersData[match.player1_id] : null,
              player2: match.player2_id ? playersData[match.player2_id] : null,
              winner: match.winner_id ? playersData[match.winner_id] : null,
            }))

            setMatches(matchesWithPlayers)
          } else if (matchesError) {
            console.error('Error loading top8 matches:', matchesError)
            if (matchesError.code === '42P01') { // table doesn't exist
              setDbError('Top 8 tables not found. Please run database migrations.')
            } else if (matchesError.code === 'PGRST200') { // foreign key relationship not found
              setDbError('Top 8 database schema is incomplete. Please run migration 017-complete-top8-system.sql')
            } else {
              setDbError(`Database error: ${matchesError.message}`)
            }
          }
        } else if (top8Error && top8Error.code !== 'PGRST116') {
          // PGRST116 is "not found" which is expected if no top8 exists
          console.error('Error loading top8:', top8Error)
          if (top8Error.code === '42P01') { // table doesn't exist
            setDbError('Top 8 tables not found. Please run database migrations.')
          } else if (top8Error.code === 'PGRST200') { // foreign key relationship not found
            setDbError('Top 8 database schema is incomplete. Please run migration 017-complete-top8-system.sql')
          } else {
            setDbError(`Database error: ${top8Error.message}`)
          }
        }
      } catch (error) {
        console.error('Error checking for existing top8:', error)
        // Continue without top8 data - this might happen if tables don't exist yet
        setDbError('Database error occurred. Please check if migrations are applied.')
      }

      // Load legs for this season
      const { data: legsData, error: legsError } = await supabase
        .from('legs')
        .select('*')
        .eq('season_id', seasonId)
        .order('round_number', { ascending: true })

      if (legsError) {
        console.error('Error loading legs:', legsError)
        return
      }

      setLegs(legsData || [])

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadStandings = async (seasonId: string): Promise<PlayerStanding[]> => {
    try {
      // Load season info to get best_legs_count and store_id
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('best_legs_count, store_id')
        .eq('id', seasonId)
        .single()

      if (seasonError) {
        console.error('Error loading season:', seasonError)
        return []
      }

      if (!seasonData?.store_id) {
        console.error('Season has no store_id')
        return []
      }

      // Load legs for this season
      const { data: legsData, error: legsError } = await supabase
        .from('legs')
        .select('*')
        .eq('season_id', seasonId)
        .order('round_number', { ascending: true })

      if (legsError) {
        console.error('Error loading legs:', legsError)
        return []
      }

      const legs = legsData || []
      const completedLegs = legs.filter(leg => leg.status === 'completed')
      
      if (completedLegs.length === 0) {
        return []
      }

      // Get all non-deleted players from the store for standings calculation
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, name, visibility')
        .eq('store_id', seasonData.store_id)
        .is('deleted_at', null)

      if (playersError) {
        console.error('Error loading players:', playersError)
        return []
      }

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
        .in('leg_id', completedLegs.map(leg => leg.id))

      if (resultsError) {
        console.error('Error loading leg results:', resultsError)
        return []
      }

      // Calculate standings using the same logic as legs page
      const standingsMap = new Map<string, PlayerStanding>()

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
          rank: 0,
          leg_scores: {},
          best_leg_ids: []
        })
      })

      // Process results by leg
      completedLegs.forEach(leg => {
        const legResults = allResults?.filter(r => r.leg_id === leg.id) || []

        legResults.forEach(result => {
          const standing = standingsMap.get(result.player_id)
          if (standing) {
            standing.total_wins += result.wins || 0
            standing.total_draws += result.draws || 0
            standing.total_losses += result.losses || 0
            standing.total_points += result.points || 0
            if (result.participated) {
              standing.legs_played += 1
            }

            // Store individual leg scores
            standing.leg_scores[leg.id] = {
              wins: result.wins || 0,
              draws: result.draws || 0,
              losses: result.losses || 0,
              points: result.points || 0,
              participated: result.participated || false
            }
          }
        })
      })

      // Convert to array and apply best N results calculation
      const standingsArray = Array.from(standingsMap.values())
        .map(standing => {
          // Calculate best N results for this player
          const bestResults = calculateBestNResults(standing.leg_scores || {}, seasonData.best_legs_count)
          
          return {
            ...standing,
            total_wins: bestResults.totalWins,
            total_draws: bestResults.totalDraws,
            total_losses: bestResults.totalLosses,
            total_points: bestResults.totalPoints,
            best_leg_ids: bestResults.bestLegIds
          }
        })
        .sort((a, b) => b.total_points - a.total_points)

      // Add rank
      standingsArray.forEach((standing, index) => {
        standing.rank = index + 1
      })

      return standingsArray

    } catch (error) {
      console.error('Error loading standings:', error)
      return []
    }
  }

  const calculateBestNResults = (
    legScores: { [legId: string]: { wins: number; draws: number; losses: number; points: number; participated: boolean } },
    bestLegsCount: number
  ): { bestLegIds: string[]; totalPoints: number; totalWins: number; totalDraws: number; totalLosses: number } => {
    // Convert to array of { legId, points } and sort by points descending
    const legResults = Object.entries(legScores)
      .map(([legId, score]) => ({
        legId,
        points: score.participated ? score.points : 0, // Treat non-participation as 0
        participated: score.participated
      }))
      .sort((a, b) => b.points - a.points) // Sort by points descending

    // Take the best N results
    const bestResults = legResults.slice(0, bestLegsCount)
    const bestLegIds = bestResults.map(result => result.legId)

    // Calculate totals from best results
    const totalPoints = bestResults.reduce((sum, result) => sum + result.points, 0)
    
    // For wins/draws/losses, we need to get the actual values from the original scores
    let totalWins = 0
    let totalDraws = 0
    let totalLosses = 0
    
    bestLegIds.forEach(legId => {
      const score = legScores[legId]
      if (score.participated) {
        totalWins += score.wins || 0
        totalDraws += score.draws || 0
        totalLosses += score.losses || 0
      }
    })

    return {
      bestLegIds,
      totalPoints,
      totalWins,
      totalDraws,
      totalLosses
    }
  }

  const handleCreateTop8 = async () => {
    try {
      setSaving(true)

      const { data, error } = await supabase
        .rpc('create_top8_for_season', { p_season_id: seasonId })

      if (error) {
        console.error('Error creating top8:', error)
        if (error.code === '42883') {
          toast.error('Top 8 functionality not available yet. Please run the database migrations first.')
        } else {
          toast.error('Failed to create top8: ' + error.message)
        }
        return
      }

      toast.success('Top 8 tournament created successfully!')
      
      // After creating the Top 8, automatically seed the Quarter Finals
      await seedQuarterFinals(data)
      
      loadData() // Refresh to load the new top8
    } catch (error) {
      console.error('Error creating top8:', error)
      toast.error('Failed to create top8')
    } finally {
      setSaving(false)
    }
  }

  const seedQuarterFinals = async (top8Id: string) => {
    try {
      // Get the top 8 players from standings
      const top8Players = standings.slice(0, 8)
      
      if (top8Players.length < 8) {
        console.warn('Not enough players for Top 8 seeding')
        return
      }

      // Standard tournament seeding: 1v8, 2v7, 3v6, 4v5
      const seedings = [
        { matchOrdinal: 1, player1Rank: 1, player2Rank: 8 }, // 1st vs 8th
        { matchOrdinal: 2, player1Rank: 2, player2Rank: 7 }, // 2nd vs 7th
        { matchOrdinal: 3, player1Rank: 3, player2Rank: 6 }, // 3rd vs 6th
        { matchOrdinal: 4, player1Rank: 4, player2Rank: 5 }, // 4th vs 5th
      ]

      // Update each Quarter Final match with the seeded players
      for (const seeding of seedings) {
        const player1 = top8Players.find(p => p.rank === seeding.player1Rank)
        const player2 = top8Players.find(p => p.rank === seeding.player2Rank)
        
        if (player1 && player2) {
          const { error } = await supabase
            .from('top8_matches')
            .update({
              player1_id: player1.player_id,
              player2_id: player2.player_id
            })
            .eq('top8_id', top8Id)
            .eq('round', 'qf')
            .eq('ordinal', seeding.matchOrdinal)

          if (error) {
            console.error(`Error seeding match ${seeding.matchOrdinal}:`, error)
          }
        }
      }

      console.log('Quarter Finals seeded successfully')
    } catch (error) {
      console.error('Error seeding Quarter Finals:', error)
    }
  }

  const handleUpdateMatch = async (matchId: string, field: 'player1_id' | 'player2_id' | 'result', value: string | null) => {
    try {
      console.log('Updating match:', { matchId, field, value })
      console.log('Current matches state:', matches)
      
      // Simple update - just update the specific field
      const updateData = { [field]: value }
      console.log('Sending update data:', updateData)
      
      const { error } = await supabase
        .from('top8_matches')
        .update(updateData)
        .eq('id', matchId)

      if (error) {
        console.error('Error updating match:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        toast.error('Failed to update match')
        return
      }

      console.log('Match updated successfully')

      // Refresh matches
      if (top8) {
        const { data: matchesData, error: matchesError } = await supabase
          .from('top8_matches')
          .select('*')
          .eq('top8_id', top8.id)
          .order('round', { ascending: true })
          .order('ordinal', { ascending: true })

        if (!matchesError && matchesData) {
          console.log('Refreshed matches data:', matchesData)
          
          // Load player data separately to avoid foreign key issues
          const playerIds = new Set<string>()
          matchesData.forEach(match => {
            if (match.player1_id) playerIds.add(match.player1_id)
            if (match.player2_id) playerIds.add(match.player2_id)
            if (match.winner_id) playerIds.add(match.winner_id)
          })

          let playersData: { [key: string]: Player } = {}
          if (playerIds.size > 0) {
            const { data: players, error: playersError } = await supabase
              .from('players')
              .select('id, name, visibility')
              .in('id', Array.from(playerIds))

            if (!playersError && players) {
              players.forEach(player => {
                playersData[player.id] = player
              })
            }
          }

          // Combine matches with player data
          const matchesWithPlayers = matchesData.map(match => ({
            ...match,
            player1: match.player1_id ? playersData[match.player1_id] : null,
            player2: match.player2_id ? playersData[match.player2_id] : null,
            winner: match.winner_id ? playersData[match.winner_id] : null,
          }))

          setMatches(matchesWithPlayers)
        }
      }

      toast.success('Match updated successfully!')
    } catch (error) {
      console.error('Error updating match:', error)
      toast.error('Failed to update match')
    }
  }

  const handleCompleteTop8 = async () => {
    if (!top8) return

    try {
      setSaving(true)

      const { data, error } = await supabase
        .rpc('complete_top8', { p_top8_id: top8.id })

      if (error) {
        console.error('Error completing top8:', error)
        if (error.code === '42883') {
          toast.error('Top 8 functionality not available yet. Please run the database migrations first.')
        } else {
          toast.error('Failed to complete top8: ' + error.message)
        }
        return
      }

      // Handle the new JSONB response
      if (data && typeof data === 'object') {
        if (data.success) {
          toast.success(data.message || 'Top 8 tournament completed! Season is now finished.')
          loadData() // Refresh to show completed status
        } else {
          console.error('Complete top8 returned error:', data)
          toast.error(data.error || 'Failed to complete top8')
        }
      } else {
        // Fallback for old response format
        toast.success('Top 8 tournament completed! Season is now finished.')
        loadData() // Refresh to show completed status
      }
    } catch (error) {
      console.error('Error completing top8:', error)
      toast.error('Failed to complete top8')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTop8 = async () => {
    if (!top8) return

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this Top 8 tournament? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase
        .rpc('delete_top8', { p_top8_id: top8.id })

      if (error) {
        console.error('Error deleting top8:', error)
        toast.error('Failed to delete Top 8: ' + error.message)
        return
      }

      toast.success('Top 8 tournament deleted successfully!')
      
      // Reset the state to show "No Top 8 Tournament Yet"
      setTop8(null)
      setMatches([])
      
    } catch (error) {
      console.error('Error deleting top8:', error)
      toast.error('Failed to delete Top 8')
    } finally {
      setSaving(false)
    }
  }

  const getPlayerDisplayName = (player: Player | null | undefined): string => {
    if (!player) return 'TBD'
    // For TO view, show actual names even for private players
    // Deleted players already have "Deleted Player" as their name in the database
    return player.name
  }

  const calculateWinner = (match: Top8Match): Player | null => {
    if (!match.result || !match.player1_id || !match.player2_id) {
      return null
    }
    
    // Find the winning player based on result
    let winnerId: string | null = null
    if (match.result === '2-0' || match.result === '2-1') {
      winnerId = match.player1_id
    } else if (match.result === '0-2' || match.result === '1-2') {
      winnerId = match.player2_id
    }
    
    if (!winnerId) return null
    
    // Find the winner player object
    return allSeasonPlayers.find(p => p.id === winnerId) || null
  }

  const getRoundDisplayName = (round: string): string => {
    switch (round) {
      case 'qf': return 'Quarter Final'
      case 'sf': return 'Semi Final'
      case 'final': return 'Final'
      default: return round
    }
  }

  const canCompleteTop8 = (): boolean => {
    if (!top8 || top8.status === 'completed') return false
    return matches.every(match => match.result !== null && match.result !== undefined)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading Top 8...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Button variant="outline" onClick={() => router.push('/to/seasons')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Seasons
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
            Top 8 Tournament
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {season?.name} - {store?.name}
          </p>
        </div>
        {top8 && top8.status !== 'completed' && (
          <div className="flex space-x-2">
            <Button onClick={handleDeleteTop8} disabled={saving} variant="destructive">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Tournament
                </>
              )}
            </Button>
            {canCompleteTop8() && (
              <Button onClick={handleCompleteTop8} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Tournament
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Database Migration Notice */}
      {dbError && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
              <p className="text-yellow-800 dark:text-yellow-200">
                <strong>Database Setup Required:</strong> {dbError} 
                Please run migration 017-complete-top8-system.sql to enable this functionality.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Season Standings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Season Standings</span>
          </CardTitle>
          <CardDescription>
            Best {season?.best_legs_count} results from completed legs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {legs && legs.length > 0 && standings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">Player</TableHead>
                    {legs.filter(leg => leg.status === 'completed').map((leg) => (
                      <TableHead key={leg.id} className="text-center">
                        <div className="space-y-1">
                          <div className="font-medium">Round {leg.round_number}</div>
                          {/* Optionally add status badge here if needed */}
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
                          <span>{getPlayerDisplayName({
                            id: standing.player_id,
                            name: standing.player_name,
                            visibility: standing.player_visibility
                          })}</span>
                          {standing.player_visibility === 'private' && (
                            <Badge variant="secondary" className="text-xs">Private</Badge>
                          )}
                          {standing.player_name === 'Deleted Player' && (
                            <Badge variant="destructive" className="text-xs">Deleted</Badge>
                          )}
                        </div>
                      </TableCell>
                      {legs.filter(leg => leg.status === 'completed').map((leg) => (
                        <TableCell
                          key={leg.id}
                          className={`text-center text-sm ${
                            standing.best_leg_ids && standing.best_leg_ids.includes(leg.id)
                              ? 'bg-green-50 dark:bg-green-900/20 font-semibold text-green-700 dark:text-green-300'
                              : ''
                          }`}
                        >
                          {standing.leg_scores && standing.leg_scores[leg.id]
                            ? (standing.leg_scores[leg.id].participated
                                ? standing.leg_scores[leg.id].points
                                : 'DNP')
                            : '-'}
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
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No standings available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 8 Tournament */}
      {!top8 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Top 8 Tournament Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create a Top 8 tournament to determine the season champion.
            </p>
            <Button onClick={handleCreateTop8} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Create Top 8 Tournament
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Top 8 Tournament</span>
              <Badge variant={top8.status === 'completed' ? 'default' : 'secondary'}>
                {top8.status === 'completed' ? 'Completed' : 'In Progress'}
              </Badge>
            </CardTitle>
            <CardDescription>
              {top8.status === 'completed' 
                ? `Completed on ${new Date(top8.completed_at!).toLocaleDateString()}`
                : 'Manage tournament matches and results'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quarter Finals */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Quarter Finals</h3>
                {matches.filter(m => m.round === 'qf').map((match) => (
                  <Card key={match.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Match {match.ordinal}</span>
                      </div>
                      
                      {/* Player 1 */}
                      <div>
                        <Select
                          value={match.player1_id || ''}
                          onValueChange={(value) => handleUpdateMatch(match.id, 'player1_id', value || null)}
                          disabled={top8.status === 'completed'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select player 1" />
                          </SelectTrigger>
                          <SelectContent>
                            {allSeasonPlayers.map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {getPlayerDisplayName(player)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Player 2 */}
                      <div>
                        <Select
                          value={match.player2_id || ''}
                          onValueChange={(value) => handleUpdateMatch(match.id, 'player2_id', value || null)}
                          disabled={top8.status === 'completed'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select player 2" />
                          </SelectTrigger>
                          <SelectContent>
                            {allSeasonPlayers.map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {getPlayerDisplayName(player)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Result */}
                      {match.player1_id && match.player2_id && (
                        <div>
                          <Select
                            value={match.result || ''}
                            onValueChange={(value) => handleUpdateMatch(match.id, 'result', value || null)}
                            disabled={top8.status === 'completed'}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select result" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2-0">2-0</SelectItem>
                              <SelectItem value="2-1">2-1</SelectItem>
                              <SelectItem value="1-2">1-2</SelectItem>
                              <SelectItem value="0-2">0-2</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Winner indicator */}
                      {match.result && (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Winner: {getPlayerDisplayName(calculateWinner(match))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Semi Finals */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Semi Finals</h3>
                {matches.filter(m => m.round === 'sf').map((match) => (
                  <Card key={match.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Match {match.ordinal}</span>
                      </div>
                      
                      {/* Player 1 */}
                      <div>
                        <Select
                          value={match.player1_id || ''}
                          onValueChange={(value) => handleUpdateMatch(match.id, 'player1_id', value || null)}
                          disabled={top8.status === 'completed'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select player 1" />
                          </SelectTrigger>
                          <SelectContent>
                            {allSeasonPlayers.map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {getPlayerDisplayName(player)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Player 2 */}
                      <div>
                        <Select
                          value={match.player2_id || ''}
                          onValueChange={(value) => handleUpdateMatch(match.id, 'player2_id', value || null)}
                          disabled={top8.status === 'completed'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select player 2" />
                          </SelectTrigger>
                          <SelectContent>
                            {allSeasonPlayers.map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {getPlayerDisplayName(player)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Result */}
                      {match.player1_id && match.player2_id && (
                        <div>
                          <Select
                            value={match.result || ''}
                            onValueChange={(value) => handleUpdateMatch(match.id, 'result', value || null)}
                            disabled={top8.status === 'completed'}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select result" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2-0">2-0</SelectItem>
                              <SelectItem value="2-1">2-1</SelectItem>
                              <SelectItem value="1-2">1-2</SelectItem>
                              <SelectItem value="0-2">0-2</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Winner indicator */}
                      {match.result && (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Winner: {getPlayerDisplayName(calculateWinner(match))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Final */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Final</h3>
                {matches.filter(m => m.round === 'final').map((match) => (
                  <Card key={match.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Championship</span>
                      </div>
                      
                      {/* Player 1 */}
                      <div>
                        <Select
                          value={match.player1_id || ''}
                          onValueChange={(value) => handleUpdateMatch(match.id, 'player1_id', value || null)}
                          disabled={top8.status === 'completed'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select player 1" />
                          </SelectTrigger>
                          <SelectContent>
                            {allSeasonPlayers.map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {getPlayerDisplayName(player)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Player 2 */}
                      <div>
                        <Select
                          value={match.player2_id || ''}
                          onValueChange={(value) => handleUpdateMatch(match.id, 'player2_id', value || null)}
                          disabled={top8.status === 'completed'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select player 2" />
                          </SelectTrigger>
                          <SelectContent>
                            {allSeasonPlayers.map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {getPlayerDisplayName(player)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Result */}
                      {match.player1_id && match.player2_id && (
                        <div>
                          <Select
                            value={match.result || ''}
                            onValueChange={(value) => handleUpdateMatch(match.id, 'result', value || null)}
                            disabled={top8.status === 'completed'}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select result" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2-0">2-0</SelectItem>
                              <SelectItem value="2-1">2-1</SelectItem>
                              <SelectItem value="1-2">1-2</SelectItem>
                              <SelectItem value="0-2">0-2</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Winner indicator */}
                      {match.result && (
                        <div className="text-sm text-green-600 dark:text-green-400 font-bold">
                          🏆 Champion: {getPlayerDisplayName(calculateWinner(match))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 