'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy, Calendar, Plus, Loader2, Users, Play, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Season {
  id: string
  name: string
  total_legs: number
  best_legs_count: number
  status: 'active' | 'completed'
  created_at: string
}

interface Leg {
  id: string
  name: string
  round_number: number
  status: 'scheduled' | 'in_progress' | 'completed'
  created_at: string
  completed_at?: string
}

interface Store {
  id: string
  name: string
  address: string
}

interface Player {
  id: string
  name: string
  email?: string
}

interface PlayerResult {
  player_id: string
  player_name: string
  wins: number
  draws: number
  losses: number
  points: number
  participated: boolean
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

export default function LegsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<Store | null>(null)
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null)
  const [legs, setLegs] = useState<Leg[]>([])
  const [standings, setStandings] = useState<PlayerStanding[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [legToDelete, setLegToDelete] = useState<Leg | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    round_number: 1
  })

  useEffect(() => {
    loadData()
  }, [])

  // Handle URL parameters for season selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const seasonId = urlParams.get('season')
    
    if (seasonId && seasons.length > 0) {
      const season = seasons.find(s => s.id === seasonId)
      if (season && season.id !== selectedSeason?.id) {
        setSelectedSeason(season)
        loadLegs(season.id)
      }
    }
  }, [seasons, selectedSeason])

  // Ensure standings are loaded when both season and legs are available
  useEffect(() => {
    if (selectedSeason && legs.length >= 0 && store) {
      console.log('Reloading standings due to season/legs change')
      loadStandings(selectedSeason.id, legs)
    }
  }, [selectedSeason, legs, store])

  const loadData = async () => {
    try {
      console.log('Loading legs page data...')
      setLoading(true)

      // Get user's store assignment
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        console.log('No auth user, redirecting to login')
        router.push('/login')
        return
      }

      console.log('Auth user found:', authUser.email)

      // Load TO's assigned stores
      const { data: storeAssignments } = await supabase
        .from('store_tos')
        .select('store_id')
        .eq('user_id', authUser.id)

      if (!storeAssignments || storeAssignments.length === 0) {
        console.log('No store assignments found')
        toast.error('No store assignment found for this user')
        return
      }

      console.log('Store assignments found:', storeAssignments)

      // Get store information
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeAssignments[0].store_id)

      if (storeError || !storeData || storeData.length === 0) {
        console.log('Store error:', storeError)
        toast.error('Failed to load store information')
        return
      }

      console.log('Store data loaded:', storeData[0])
      setStore(storeData[0])

      // Load seasons for this store
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('seasons')
        .select('*')
        .eq('store_id', storeData[0].id)
        .order('created_at', { ascending: false })

      if (!seasonsError) {
        console.log('Seasons loaded:', seasonsData)
        setSeasons(seasonsData || [])
        if (seasonsData && seasonsData.length > 0) {
          console.log('Setting selected season:', seasonsData[0])
          setSelectedSeason(seasonsData[0])
          await loadLegs(seasonsData[0].id)
        }
      } else {
        console.error('Error loading seasons:', seasonsError)
        toast.error('Failed to load seasons')
      }

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }

  const loadLegs = async (seasonId: string) => {
    try {
      console.log('Loading legs for season:', seasonId)
      const { data: legsData, error: legsError } = await supabase
        .from('legs')
        .select('*')
        .eq('season_id', seasonId)
        .order('round_number', { ascending: true })

      if (!legsError) {
        console.log('Legs loaded:', legsData)
        setLegs(legsData || [])
      } else {
        console.error('Error loading legs:', legsError)
        toast.error('Failed to load legs')
      }
    } catch (error) {
      console.error('Error loading legs:', error)
      toast.error('Failed to load legs')
    }
  }

  const loadStandings = async (seasonId: string, legsList: Leg[]) => {
    try {
      console.log('Loading standings for season:', seasonId)
      
      // Get all players from the store
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, name')
        .eq('store_id', store?.id)

      if (playersError) {
        console.error('Error loading players:', playersError)
        return
      }

      console.log('Players loaded:', players)

      // Only get results from completed legs
      const completedLegs = legsList.filter(leg => leg.status === 'completed')
      console.log('Completed legs:', completedLegs)

      if (completedLegs.length === 0) {
        console.log('No completed legs found')
        setStandings([])
        return
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
        return
      }

      console.log('All leg results loaded:', allResults)

      // Calculate standings
      const standingsMap = new Map<string, PlayerStanding>()

      // Initialize all players
      players?.forEach(player => {
        standingsMap.set(player.id, {
          player_id: player.id,
          player_name: player.name,
          total_wins: 0,
          total_draws: 0,
          total_losses: 0,
          total_points: 0,
          legs_played: 0,
          leg_scores: {},
          best_leg_ids: []
        })
      })

      // Process results by leg
      completedLegs.forEach(leg => {
        const legResults = allResults?.filter(r => r.leg_id === leg.id) || []

        console.log(`Results for leg ${leg.id}:`, legResults)

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

      // Convert to array and sort by total points
      const standingsArray = Array.from(standingsMap.values())
        .map(standing => {
          // Calculate best N results for this player
          const bestResults = calculateBestNResults(standing.leg_scores, selectedSeason?.best_legs_count || 0)
          
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

      console.log('Calculated standings:', standingsArray)
      setStandings(standingsArray)

    } catch (error) {
      console.error('Error loading standings:', error)
    }
  }

  const handleSeasonChange = async (seasonId: string) => {
    const season = seasons.find(s => s.id === seasonId)
    if (season) {
      setSelectedSeason(season)
      await loadLegs(seasonId)
    }
  }

  const handleCreateLeg = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSeason) {
      toast.error('Please select a season')
      return
    }

    if (!formData.name.trim()) {
      toast.error('Please enter a leg name')
      return
    }

    // Check if we've reached the total_legs limit
    if (legs.length >= selectedSeason.total_legs) {
      toast.error(`Cannot create more legs. This season is limited to ${selectedSeason.total_legs} legs.`)
      return
    }

    // Check if there are any unsaved legs (legs without results)
    const unsavedLegs = legs.filter(leg => leg.status !== 'completed')
    if (unsavedLegs.length > 0) {
      toast.error(`Please save results for ${unsavedLegs.length} unsaved leg${unsavedLegs.length > 1 ? 's' : ''} before creating a new one`)
      return
    }

    setSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('legs')
        .insert({
          season_id: selectedSeason.id,
          name: formData.name.trim(),
          round_number: formData.round_number,
          status: 'scheduled'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating leg:', error)
        toast.error('Failed to create leg')
        return
      }

      toast.success('Leg created successfully!')
      setCreateDialogOpen(false)
      const nextRoundNumber = legs.length > 0 ? Math.max(...legs.map(leg => leg.round_number)) + 1 : 1
      setFormData({ name: '', round_number: nextRoundNumber })
      await loadLegs(selectedSeason.id)
      
      // Navigate to the newly created leg page
      router.push(`/to/legs/${data.id}/results`)
    } catch (error) {
      console.error('Error creating leg:', error)
      toast.error('Failed to create leg')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteLeg = async () => {
    if (!legToDelete || !selectedSeason) {
      toast.error('No leg selected for deletion')
      return
    }

    setDeleting(true)

    try {
      // First delete all leg results for this leg
      const { error: resultsError } = await supabase
        .from('leg_results')
        .delete()
        .eq('leg_id', legToDelete.id)

      if (resultsError) {
        console.error('Error deleting leg results:', resultsError)
        toast.error('Failed to delete leg results')
        return
      }

      // Then delete the leg itself
      const { error: legError } = await supabase
        .from('legs')
        .delete()
        .eq('id', legToDelete.id)

      if (legError) {
        console.error('Error deleting leg:', legError)
        toast.error('Failed to delete leg')
        return
      }

      toast.success('Leg deleted successfully!')
      setDeleteDialogOpen(false)
      setLegToDelete(null)
      await loadLegs(selectedSeason.id)
    } catch (error) {
      console.error('Error deleting leg:', error)
      toast.error('Failed to delete leg')
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteDialog = (leg: Leg) => {
    setLegToDelete(leg)
    setDeleteDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Scheduled</Badge>
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-600 flex items-center gap-1"><Play className="h-3 w-3" />In Progress</Badge>
      case 'completed':
        return <Badge variant="outline" className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Completed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  // Calculate next round number when opening create dialog
  const openCreateDialog = () => {
    const nextRoundNumber = legs.length > 0 ? Math.max(...legs.map(leg => leg.round_number)) + 1 : 1
    setFormData({ name: '', round_number: nextRoundNumber })
    setCreateDialogOpen(true)
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

  // Core logic functions for calculating best N results (testable)
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

  const isBestResult = (legId: string, bestLegIds: string[]): boolean => {
    return bestLegIds.includes(legId)
  }

  const getPlayerScoreForLeg = (playerId: string, legId: string): string => {
    const standing = standings.find(s => s.player_id === playerId)
    if (!standing || !standing.leg_scores[legId]) {
      return '-'
    }
    const legScore = standing.leg_scores[legId]
    if (!legScore.participated) {
      return 'DNP'
    }
    return legScore.points.toString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading legs...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Legs</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage tournament legs for {store?.name}
          </p>
        </div>
        {selectedSeason && legs.length >= selectedSeason.total_legs ? (
          <Button 
            onClick={() => router.push(`/to/top8?season=${selectedSeason.id}`)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Top 8
          </Button>
        ) : (
          <Button 
            onClick={openCreateDialog} 
            disabled={!selectedSeason || legs.some(leg => leg.status !== 'completed')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Leg
          </Button>
        )}
      </div>

      {/* Warning message for unsaved legs */}
      {selectedSeason && legs.some(leg => leg.status !== 'completed') && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-yellow-800 dark:text-yellow-200">
              Please save results for all existing legs before creating a new one.
            </p>
          </div>
        </div>
      )}

      {/* Season Selector */}
      {seasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Season</CardTitle>
            <CardDescription>Choose a season to manage its legs</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedSeason?.id} onValueChange={handleSeasonChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a season" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name} ({season.total_legs} legs)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Season Standings */}
      {selectedSeason && legs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Season Standings</span>
            </CardTitle>
            <CardDescription>
              Best {selectedSeason?.best_legs_count || 0} results from completed legs for {selectedSeason.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {standings.length === 0 ? (
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
                      {legs.filter(leg => leg.status === 'completed').map((leg) => (
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
                        {legs.filter(leg => leg.status === 'completed').map((leg) => (
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
      )}

      {/* Legs List */}
      {!selectedSeason ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No season selected</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please select a season to view and manage its legs.
            </p>
          </CardContent>
        </Card>
      ) : legs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No legs yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedSeason && legs.length >= selectedSeason.total_legs 
                ? 'All legs have been completed. Ready for Top 8!'
                : 'Create your first leg to start the tournament.'
              }
            </p>
            {selectedSeason && legs.length >= selectedSeason.total_legs ? (
              <Button 
                onClick={() => router.push(`/to/top8?season=${selectedSeason.id}`)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Top 8
              </Button>
            ) : (
              <Button 
                onClick={openCreateDialog}
                disabled={legs.some(leg => leg.status !== 'completed')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Leg
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {legs.map((leg) => (
            <Card key={leg.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{leg.name}</CardTitle>
                  {getStatusBadge(leg.status)}
                </div>
                <CardDescription>
                  Round {leg.round_number} • Created {new Date(leg.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="font-medium capitalize">{leg.status.replace('_', ' ')}</span>
                  </div>
                  {leg.completed_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Completed:</span>
                      <span className="font-medium">{new Date(leg.completed_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t space-y-2">
                  <Link href={`/to/legs/${leg.id}/results`}>
                    <Button variant="outline" className="w-full">
                      {leg.status === 'completed' ? 'View Results' : 'Enter Results'}
                    </Button>
                  </Link>
                  {/* Only show delete button for the most recent leg */}
                  {legs.length > 0 && leg.round_number === Math.max(...legs.map(l => l.round_number)) && (
                    <Button 
                      variant="outline" 
                      className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      onClick={() => openDeleteDialog(leg)}
                    >
                      Delete Leg
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Leg Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Leg</DialogTitle>
            <DialogDescription>
              Create a new tournament leg for {selectedSeason?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLeg} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Leg Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Leg 1, January Tournament, etc."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="round_number">Round Number</Label>
              <Input
                id="round_number"
                type="number"
                min="1"
                value={formData.round_number}
                readOnly
                className="bg-gray-50 dark:bg-gray-800"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Leg'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Leg Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Leg</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{legToDelete?.name}"? This action cannot be undone and will remove all results for this leg.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setLegToDelete(null)
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteLeg}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Leg'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 