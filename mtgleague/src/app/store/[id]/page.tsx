'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy, Store, MapPin, Users, Calendar, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface Store {
  id: string
  name: string
  address: string
  logo_url?: string
  cms_details?: string
  created_at: string
}

interface Season {
  id: string
  name: string
  total_legs: number
  best_legs_count: number
  status: 'active' | 'completed'
  created_at: string
  completed_at?: string
}

interface Leg {
  id: string
  name: string
  round_number: number
  status: 'scheduled' | 'in_progress' | 'completed'
  created_at: string
  completed_at?: string
}

interface PlayerStanding {
  player_id: string
  player_name: string
  total_wins: number
  total_draws: number
  total_losses: number
  total_points: number
  legs_played: number
  leg_scores: { [legId: string]: { wins: number; draws: number; losses: number; points: number; participated: boolean } }
  best_leg_ids: string[]
}

interface SeasonData {
  season: Season
  legs: Leg[]
  standings: PlayerStanding[]
}

export default function StoreDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const storeId = params.id as string

  const [store, setStore] = useState<Store | null>(null)
  const [seasons, setSeasons] = useState<Season[]>([])
  const [seasonData, setSeasonData] = useState<{ [seasonId: string]: SeasonData }>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showPreviousSeasons, setShowPreviousSeasons] = useState(false)
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    loadStoreData()
  }, [storeId])

  const loadStoreData = async () => {
    try {
      setLoading(true)
      
      // Load store information
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single()

      if (storeError || !storeData) {
        toast.error('Store not found')
        router.push('/')
        return
      }

      setStore(storeData)

      // Load seasons for this store
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('seasons')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })

      if (!seasonsError && seasonsData) {
        setSeasons(seasonsData)
        // Load data for all active seasons
        const activeSeasons = seasonsData.filter(s => s.status === 'active')
        for (const season of activeSeasons) {
          await loadSeasonData(season.id)
        }
      }

    } catch (error) {
      console.error('Error loading store data:', error)
      toast.error('Failed to load store data')
    } finally {
      setLoading(false)
    }
  }

  const loadSeasonData = async (seasonId: string) => {
    try {
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

      const legs = legsData || []

      // Load standings for this season
      const standings = await loadStandings(seasonId, legs)

      // Update season data
      const season = seasons.find(s => s.id === seasonId)
      if (season) {
        setSeasonData(prev => ({
          ...prev,
          [seasonId]: {
            season,
            legs,
            standings
          }
        }))
      }

    } catch (error) {
      console.error('Error loading season data:', error)
      toast.error('Failed to load season data')
    }
  }

  const loadStandings = async (seasonId: string, legsList: Leg[]): Promise<PlayerStanding[]> => {
    try {
      // Check if we have legs to query
      if (legsList.length === 0) {
        console.log('No legs found for season:', seasonId)
        return []
      }

      // Filter to only completed legs since anonymous users can only access completed leg results
      const completedLegs = legsList.filter(leg => leg.status === 'completed')
      
      if (completedLegs.length === 0) {
        console.log('No completed legs found for season:', seasonId)
        return []
      }

      console.log('Loading standings for season:', seasonId, 'with completed legs:', completedLegs.map(l => l.id))

      // Get all players who have participated in any completed leg of this season
      const { data: playerResults, error: resultsError } = await supabase
        .from('leg_results')
        .select(`
          player_id,
          player_name,
          leg_id,
          wins,
          draws,
          losses,
          points,
          participated
        `)
        .in('leg_id', completedLegs.map(leg => leg.id))

      if (resultsError) {
        console.error('Error loading player results:', resultsError)
        console.error('Query details:', {
          seasonId,
          legIds: completedLegs.map(leg => leg.id),
          error: resultsError
        })
        return []
      }

      console.log('Player results loaded:', playerResults?.length || 0, 'results')

      // Group results by player
      const playerMap = new Map<string, PlayerStanding>()

      playerResults?.forEach(result => {
        if (!playerMap.has(result.player_id)) {
          playerMap.set(result.player_id, {
            player_id: result.player_id,
            player_name: result.player_name,
            total_wins: 0,
            total_draws: 0,
            total_losses: 0,
            total_points: 0,
            legs_played: 0,
            leg_scores: {},
            best_leg_ids: []
          })
        }

        const player = playerMap.get(result.player_id)!
        player.leg_scores[result.leg_id] = {
          wins: result.wins,
          draws: result.draws,
          losses: result.losses,
          points: result.points,
          participated: result.participated
        }

        if (result.participated) {
          player.total_wins += result.wins
          player.total_draws += result.draws
          player.total_losses += result.losses
          player.total_points += result.points
          player.legs_played += 1
        }
      })

      // Calculate best N results for each player
      const season = seasons.find(s => s.id === seasonId)
      if (season) {
        playerMap.forEach(player => {
          const { bestLegIds } = calculateBestNResults(player.leg_scores, season.best_legs_count)
          player.best_leg_ids = bestLegIds
        })
      }

      // Convert to array and sort by total points
      const standingsArray = Array.from(playerMap.values())
        .sort((a, b) => b.total_points - a.total_points)

      console.log('Standings calculated:', standingsArray.length, 'players')
      return standingsArray

    } catch (error) {
      console.error('Error loading standings:', error)
      toast.error('Failed to load standings')
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
        points: score.participated ? score.points : 0,
        participated: score.participated
      }))
      .sort((a, b) => b.points - a.points)

    // Take the best N results
    const bestResults = legResults.slice(0, bestLegsCount)
    const bestLegIds = bestResults.map(result => result.legId)

    // Calculate totals from best results
    const totalPoints = bestResults.reduce((sum, result) => sum + result.points, 0)
    
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

  const getPlayerScoreForLeg = (playerId: string, legId: string, seasonId: string): string => {
    const seasonDataItem = seasonData[seasonId]
    if (!seasonDataItem) return '-'
    
    const standing = seasonDataItem.standings.find(s => s.player_id === playerId)
    if (!standing || !standing.leg_scores[legId]) {
      return '-'
    }
    const legScore = standing.leg_scores[legId]
    if (!legScore.participated) {
      return 'DNP'
    }
    return legScore.points.toString()
  }

  const isBestResult = (legId: string, bestLegIds: string[]): boolean => {
    return bestLegIds.includes(legId)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadStoreData()
    setRefreshing(false)
    toast.success('Data refreshed')
  }

  const getLegStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-600">Completed</Badge>
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-600">In Progress</Badge>
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getSeasonStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600">Active</Badge>
      case 'completed':
        return <Badge variant="outline" className="text-green-600">Completed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const handleChangeStore = () => {
    localStorage.removeItem('selectedStoreId')
    router.push('/')
  }

  const activeSeasons = seasons.filter(s => s.status === 'active')
  const completedSeasons = seasons.filter(s => s.status === 'completed')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading store details...</span>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">Store not found</p>
          <Button onClick={() => router.push('/')}>Back to Store Selection</Button>
        </div>
      </div>
    )
  }

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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Store Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Store className="h-5 w-5" />
                <span>Store Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{store.name}</h3>
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>{store.address}</span>
                    </div>
                  </div>
                  {store.cms_details && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">CMS Details</h4>
                      <p className="text-gray-600 dark:text-gray-400">{store.cms_details}</p>
                    </div>
                  )}
                </div>
                {store.logo_url && (
                  <div className="flex justify-center md:justify-end">
                    <img 
                      src={store.logo_url} 
                      alt={`${store.name} logo`}
                      className="h-24 w-24 object-contain rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Seasons Standings */}
          {activeSeasons.length > 0 && (
            <div className="space-y-8">
              {activeSeasons.map((season) => {
                const seasonDataItem = seasonData[season.id]
                if (!seasonDataItem) return null
                
                const { legs, standings } = seasonDataItem
                const completedLegs = legs.filter(leg => leg.status === 'completed')
                
                return (
                  <Card key={season.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Trophy className="h-5 w-5" />
                        <span>{season.name} - Standings</span>
                        {getSeasonStatusBadge(season.status)}
                      </CardTitle>
                      <CardDescription>
                        Best {season.best_legs_count} results from completed legs
                      </CardDescription>
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
                                      <div className="font-medium">{leg.name}</div>
                                      <div className="text-xs text-gray-500">
                                        Round {leg.round_number}
                                      </div>
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
                                      <span>{standing.player_name}</span>
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
                                      {getPlayerScoreForLeg(standing.player_id, leg.id, season.id)}
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
                )
              })}
            </div>
          )}

          {/* Previous Seasons */}
          {completedSeasons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowPreviousSeasons(!showPreviousSeasons)}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Previous Seasons</span>
                  </div>
                  {showPreviousSeasons ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </CardTitle>
                <CardDescription>
                  View completed seasons and their final standings
                </CardDescription>
              </CardHeader>
              {showPreviousSeasons && (
                <CardContent>
                  <div className="space-y-4">
                    {completedSeasons.map((season) => (
                      <Card key={season.id} className="border-l-4 border-l-green-500">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">{season.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Completed {season.completed_at ? new Date(season.completed_at).toLocaleDateString() : 'Unknown'}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {season.total_legs} legs • Best {season.best_legs_count}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            variant="outline" 
                            onClick={async () => {
                              await loadSeasonData(season.id)
                              setShowPreviousSeasons(false)
                            }}
                            className="w-full"
                          >
                            View Standings
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Season Information */}
          {activeSeasons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Seasons Information</CardTitle>
                <CardDescription>
                  Overview of all active seasons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{activeSeasons.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Active Seasons</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Object.values(seasonData).reduce((total, data) => total + data.standings.length, 0)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Players</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Object.values(seasonData).reduce((total, data) => 
                        total + data.legs.filter(leg => leg.status === 'completed').length, 0
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Completed Legs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
} 