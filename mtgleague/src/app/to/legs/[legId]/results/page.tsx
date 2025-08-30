'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Loader2, Users, Trophy, Plus, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

interface Player {
  id: string
  name: string
  store_id: string
}

interface Leg {
  id: string
  name: string
  round_number: number
  status: 'scheduled' | 'in_progress' | 'completed'
  season_id: string
  created_at: string
}

interface Season {
  id: string
  name: string
  store_id: string
}

interface Store {
  id: string
  name: string
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

export default function LegResultsPage() {
  const router = useRouter()
  const params = useParams()
  const legId = params.legId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [leg, setLeg] = useState<Leg | null>(null)
  const [season, setSeason] = useState<Season | null>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [allStorePlayers, setAllStorePlayers] = useState<Player[]>([])
  const [participatingPlayers, setParticipatingPlayers] = useState<Player[]>([])
  const [playerResults, setPlayerResults] = useState<PlayerResult[]>([])
  const [lastLegResults, setLastLegResults] = useState<any[]>([])
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [addPlayerMode, setAddPlayerMode] = useState<'select' | 'new'>('select')
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')

  useEffect(() => {
    if (legId) {
      loadData()
    }
  }, [legId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Get user's store assignment
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      // Load TO's assigned stores
      const { data: storeAssignments } = await supabase
        .from('store_tos')
        .select('store_id')
        .eq('user_id', authUser.id)

      if (!storeAssignments || storeAssignments.length === 0) {
        toast.error('No store assignment found for this user')
        return
      }

      // Get leg information
      const { data: legData, error: legError } = await supabase
        .from('legs')
        .select('*')
        .eq('id', legId)
        .single()

      if (legError || !legData) {
        toast.error('Leg not found')
        router.push('/to/legs')
        return
      }

      setLeg(legData)

      // Get season information
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .eq('id', legData.season_id)
        .single()

      if (seasonError || !seasonData) {
        toast.error('Season not found')
        return
      }

      setSeason(seasonData)

      // Get store information
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

      // Get all non-deleted players from this store
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('store_id', storeData.id)
        .is('deleted_at', null)
        .order('name', { ascending: true })

      if (playersError) {
        console.error('Error loading players:', playersError)
        toast.error('Failed to load players')
        return
      }

      setAllStorePlayers(allPlayers || [])

      // Get players who have been added to this season (have any leg results record)
      const { data: seasonLegs, error: legsError } = await supabase
        .from('legs')
        .select('id')
        .eq('season_id', seasonData.id)
        .neq('id', legId) // Exclude the current leg

      if (legsError) {
        console.error('Error loading season legs:', legsError)
        toast.error('Failed to load season legs')
        return
      }

      console.log('Previous season legs found:', seasonLegs)
      const legIds = seasonLegs.map(leg => leg.id)
      
      // Get players from previous legs (for new legs)
      let leaguePlayers: Player[] = []
      let lastLegResults: any[] = []
      if (legIds.length > 0) {
        const { data: allSeasonResults, error: resultsError } = await supabase
          .from('leg_results')
          .select('player_id')
          .in('leg_id', legIds)

        if (resultsError) {
          console.error('Error loading season results:', resultsError)
          toast.error('Failed to load season results')
          return
        }

        console.log('All season results:', allSeasonResults)

        // Get unique player IDs who have been added to the league (have any leg results record)
        const leaguePlayerIds = [...new Set(allSeasonResults.map(r => r.player_id))]
        console.log('League player IDs:', leaguePlayerIds)
        
        leaguePlayers = allPlayers.filter(player => leaguePlayerIds.includes(player.id))
        console.log('League players found:', leaguePlayers)

        // Get the most recent leg results to determine who didn't play last round
        console.log('Looking for last leg before legId:', legId)
        
        // First get the current leg's round number
        const { data: currentLegData, error: currentLegError } = await supabase
          .from('legs')
          .select('round_number')
          .eq('id', legId)
          .single()
        
        if (currentLegError || !currentLegData) {
          console.log('Could not get current leg round number:', currentLegError)
        } else {
          console.log('Current leg round number:', currentLegData.round_number)
          
          // Check if this is not the first leg
          if (currentLegData.round_number > 1) {
            // Get the leg with the previous round number
            const { data: lastLegData, error: lastLegError } = await supabase
              .from('legs')
              .select('id')
              .eq('season_id', seasonData.id)
              .eq('round_number', currentLegData.round_number - 1)
              .single()

            console.log('Last leg query result:', { lastLegData, lastLegError })
            
            if (!lastLegError && lastLegData) {
              console.log('Found last leg:', lastLegData.id, 'now getting results')
              const { data: lastResults, error: lastResultsError } = await supabase
                .from('leg_results')
                .select('player_id, participated')
                .eq('leg_id', lastLegData.id)

              console.log('Last leg results query result:', { lastResults, lastResultsError })
              
              if (!lastResultsError && lastResults) {
                lastLegResults = lastResults // Use local variable directly
                setLastLegResults(lastResults) // Also set state for other functions
                console.log('Last leg results for default participation:', lastResults)
              }
            } else {
              console.log('No last leg found or error occurred:', lastLegError)
            }
          } else {
            console.log('This is the first leg of the season, no previous leg to check')
          }
        }
      } else {
        console.log('No legs found in season')
      }

      // Load existing results for this leg
      const { data: existingResults, error: resultsError } = await supabase
        .from('leg_results')
        .select('*')
        .eq('leg_id', legId)

      if (resultsError) {
        console.error('Error loading existing results:', resultsError)
        toast.error('Failed to load existing results')
        return
      }

      console.log('Existing results for this leg:', existingResults)
      console.log('Leg status:', legData.status)

      // Determine which players to show and create results
      let playersToShow: Player[] = []
      if (existingResults && existingResults.length > 0) {
        console.log('Leg has existing results, showing all players from this leg')
        // Get all players who were in this leg
        const legPlayerIds = existingResults.map(r => r.player_id)
        console.log('Leg player IDs:', legPlayerIds)
        playersToShow = allPlayers.filter(player => legPlayerIds.includes(player.id))
        console.log('Leg players found:', playersToShow)
      } else {
        console.log('No existing results, showing players from previous legs')
        // For new legs, show players from previous legs if any exist
        // If no previous legs (first leg of season), show all store players
        if (leaguePlayers.length > 0) {
          playersToShow = leaguePlayers
          console.log('Using league players from previous legs:', playersToShow)
        } else {
          playersToShow = allPlayers
          console.log('First leg of season, showing all store players:', playersToShow)
        }
      }

      // Set the participating players state
      setParticipatingPlayers(playersToShow)

      // Initialize player results directly
      const initialResults: PlayerResult[] = playersToShow.map(player => {
        const existingResult = existingResults?.find(r => r.player_id === player.id)
        console.log(`Processing player ${player.name}: existingResult=`, existingResult)
        
        // Determine default participation based on last leg
        let defaultParticipated = true
        console.log(`Checking participation for ${player.name}: existingResult=${!!existingResult}, lastLegResults.length=${lastLegResults.length}`)
        
        if (!existingResult && lastLegResults.length > 0) {
          const lastLegResult = lastLegResults.find((r: any) => r.player_id === player.id)
          console.log(`Last leg result for ${player.name}:`, lastLegResult)
          
          // If player didn't participate in last leg, default to not participating
          if (lastLegResult && !lastLegResult.participated) {
            defaultParticipated = false
            console.log(`Player ${player.name} didn't play last round, defaulting to "did not play"`)
          }
        }
        
        console.log(`Setting up result for ${player.name}:`, existingResult, 'default participated:', defaultParticipated)
        return {
          player_id: player.id,
          player_name: player.name,
          wins: existingResult?.wins || 0,
          draws: existingResult?.draws || 0,
          losses: existingResult?.losses || 0,
          points: existingResult?.points || 0,
          participated: existingResult ? existingResult.participated : defaultParticipated
        }
      })

      console.log('Initial results set up:', initialResults)
      console.log('Players to show count:', playersToShow.length)
      
      // Debug: Check which players are marked as not participating
      const notParticipating = initialResults.filter(r => !r.participated)
      console.log('Players marked as not participating:', notParticipating.map(r => r.player_name))
      
      setPlayerResults(initialResults)

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleDidNotPlayChange = (playerId: string, didNotPlay: boolean) => {
    setPlayerResults(prev => prev.map(result => {
      if (result.player_id === playerId) {
        return {
          ...result,
          participated: !didNotPlay,
          wins: didNotPlay ? 0 : result.wins,
          draws: didNotPlay ? 0 : result.draws,
          losses: didNotPlay ? 0 : result.losses,
          points: didNotPlay ? 0 : result.points
        }
      }
      return result
    }))
  }

  const handleResultChange = (playerId: string, field: 'wins' | 'draws' | 'losses', value: number) => {
    setPlayerResults(prev => prev.map(result => {
      if (result.player_id === playerId) {
        const newResult = { ...result, [field]: value }
        // Calculate points: 3 for win, 1 for draw, 0 for loss
        newResult.points = (newResult.wins * 3) + (newResult.draws * 1)
        return newResult
      }
      return result
    }))
  }

  const handleAddPlayer = async () => {
    if (addPlayerMode === 'select' && selectedPlayerId) {
      const selectedPlayer = allStorePlayers.find(p => p.id === selectedPlayerId)
      if (selectedPlayer) {
        // Add existing player to results
        // Check if they participated in the last leg to set default participation
        let defaultParticipated = true
        if (lastLegResults.length > 0) {
          const lastLegResult = lastLegResults.find((r: any) => r.player_id === selectedPlayer.id)
          if (lastLegResult && !lastLegResult.participated) {
            defaultParticipated = false
            console.log(`Adding player ${selectedPlayer.name} who didn't play last round, defaulting to "did not play"`)
          }
        }
        
        setPlayerResults(prev => [...prev, {
          player_id: selectedPlayer.id,
          player_name: selectedPlayer.name,
          wins: 0,
          draws: 0,
          losses: 0,
          points: 0,
          participated: defaultParticipated
        }])
        setShowAddPlayer(false)
        setSelectedPlayerId('')
      }
    } else if (addPlayerMode === 'new' && newPlayerName.trim()) {
      // Save new player to store immediately
      try {
        const { data: newPlayer, error } = await supabase
          .from('players')
          .insert({
            name: newPlayerName.trim(),
            store_id: store!.id
          })
          .select()
          .single()

        if (error) {
          console.error('Error saving new player:', error)
          toast.error('Failed to save new player: ' + error.message)
          return
        }

        // Add new player to results
        // Check if they participated in the last leg to set default participation
        let defaultParticipated = true
        if (lastLegResults.length > 0) {
          const lastLegResult = lastLegResults.find((r: any) => r.player_id === newPlayer.id)
          if (lastLegResult && !lastLegResult.participated) {
            defaultParticipated = false
            console.log(`Adding new player ${newPlayer.name} who didn't play last round, defaulting to "did not play"`)
          }
        }
        
        setPlayerResults(prev => [...prev, {
          player_id: newPlayer.id,
          player_name: newPlayer.name,
          wins: 0,
          draws: 0,
          losses: 0,
          points: 0,
          participated: defaultParticipated
        }])

        // Refresh the store players list (excluding deleted players)
        const { data: updatedPlayers } = await supabase
          .from('players')
          .select('*')
          .eq('store_id', store!.id)
          .is('deleted_at', null)
          .order('name')

        if (updatedPlayers) {
          setAllStorePlayers(updatedPlayers)
        }

        setShowAddPlayer(false)
        setNewPlayerName('')
        toast.success(`Player "${newPlayer.name}" added successfully!`)
      } catch (error) {
        console.error('Error saving new player:', error)
        toast.error('Failed to save new player')
      }
    }
  }

  const handleRemovePlayer = (playerId: string) => {
    setPlayerResults(prev => prev.filter(result => result.player_id !== playerId))
  }

  const getNonParticipatingPlayers = () => {
    const participatingIds = new Set(participatingPlayers.map(p => p.id))
    const currentResultIds = new Set(playerResults.map(r => r.player_id))
    return allStorePlayers.filter(player => 
      !participatingIds.has(player.id) && !currentResultIds.has(player.id)
    )
  }

  const handleSave = async () => {
    console.log('Starting save process...')
    
    // Validate that we have results to save
    if (playerResults.length === 0) {
      toast.error('No player results to save')
      return
    }

    // Validate that at least one player participated
    const participatingPlayers = playerResults.filter(result => result.participated)
    if (participatingPlayers.length === 0) {
      toast.error('At least one player must participate in the leg')
      return
    }

    // Validate that participating players have at least one game played
    const invalidPlayers = participatingPlayers.filter(result => 
      (result.wins + result.draws + result.losses) === 0
    )
    
    if (invalidPlayers.length > 0) {
      const playerNames = invalidPlayers.map(p => p.player_name).join(', ')
      toast.error(`The following players are marked as participating but have no games played: ${playerNames}. Please either enter their results or mark them as "Did not play".`)
      return
    }

    // Check if leg is already completed
    if (leg?.status === 'completed') {
      toast.error('This leg is already completed')
      return
    }

    setSaving(true)

    // Add a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.error('Save operation timed out')
      toast.error('Save operation timed out. Please try again.')
      setSaving(false)
    }, 30000) // 30 second timeout

    try {
      // Prepare data for the transaction (no need to handle new players anymore)
      const resultsToSave = playerResults.map(result => ({
        player_id: result.player_id,
        player_name: result.player_name,
        wins: result.participated ? result.wins : 0,
        draws: result.participated ? result.draws : 0,
        losses: result.participated ? result.losses : 0,
        points: result.participated ? result.points : 0,
        participated: result.participated
      }))

      console.log('Saving results via transaction:', resultsToSave.length, 'results')

      // Call the transaction-based function
      const { data, error } = await supabase.rpc('save_leg_results_transaction', {
        p_leg_id: legId,
        p_results: resultsToSave
      })

      if (error) {
        console.error('Error saving results via transaction:', error)
        
        // Check if it's a network error and suggest retry
        if (error.message?.includes('network') || error.message?.includes('timeout')) {
          toast.error('Network error. Please check your connection and try again.')
        } else {
          toast.error('Failed to save results: ' + error.message)
        }
        
        clearTimeout(timeoutId)
        setSaving(false)
        return
      }

      console.log('Transaction completed successfully:', data)
      clearTimeout(timeoutId)
      toast.success('Leg results saved successfully!')
      router.push('/to/legs')

    } catch (error) {
      console.error('Error saving results:', error)
      toast.error('Failed to save results')
      clearTimeout(timeoutId)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading leg results...</span>
        </div>
      </div>
    )
  }

  if (!leg || !season || !store) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Leg not found</p>
          <Button onClick={() => router.push('/to/legs')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Legs
          </Button>
        </div>
      </div>
    )
  }

  const nonParticipatingPlayers = getNonParticipatingPlayers()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/to/legs')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Round {leg.round_number} - Results
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {season.name} • {store.name}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Results
            </>
          )}
        </Button>
      </div>

      {/* Leg Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leg Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Round Number</Label>
              <p className="text-lg font-semibold">{leg.round_number}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</Label>
              <Badge variant={leg.status === 'completed' ? 'outline' : 'default'}>
                {leg.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Player Results
          </CardTitle>
          <CardDescription>
            Enter results for each player. Check "Did not play" if a player didn't participate in this leg.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Existing participating players */}
            {playerResults.map((result) => (
              <div key={result.player_id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{result.player_name}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`did-not-play-${result.player_id}`}
                      checked={!result.participated}
                      onCheckedChange={(checked: boolean) => 
                        handleDidNotPlayChange(result.player_id, checked)
                      }
                    />
                    <Label htmlFor={`did-not-play-${result.player_id}`}>
                      Did not play
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemovePlayer(result.player_id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                
                {result.participated && (
                  <div className="flex items-end space-x-6">
                    <div>
                      <Label htmlFor={`wins-${result.player_id}`}>Wins</Label>
                      <Input
                        id={`wins-${result.player_id}`}
                        type="number"
                        min="0"
                        max="9"
                        value={result.wins}
                        onChange={(e) => handleResultChange(result.player_id, 'wins', parseInt(e.target.value) || 0)}
                        className="w-20 h-12 text-center text-xl font-semibold"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`draws-${result.player_id}`}>Draws</Label>
                      <Input
                        id={`draws-${result.player_id}`}
                        type="number"
                        min="0"
                        max="9"
                        value={result.draws}
                        onChange={(e) => handleResultChange(result.player_id, 'draws', parseInt(e.target.value) || 0)}
                        className="w-20 h-12 text-center text-xl font-semibold"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`losses-${result.player_id}`}>Losses</Label>
                      <Input
                        id={`losses-${result.player_id}`}
                        type="number"
                        min="0"
                        max="9"
                        value={result.losses}
                        onChange={(e) => handleResultChange(result.player_id, 'losses', parseInt(e.target.value) || 0)}
                        className="w-20 h-12 text-center text-xl font-semibold"
                      />
                    </div>
                    <div>
                      <Label>Points</Label>
                      <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg border border-green-200 dark:border-green-700 min-w-[80px] h-12 flex items-center justify-center">
                        <span className="text-xl font-bold">{result.points}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {!result.participated && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      Player did not participate in this leg
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Add Player Card */}
            {!showAddPlayer ? (
              <Card 
                className="border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer transition-colors"
                onClick={() => setShowAddPlayer(true)}
              >
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">Add Player</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Add Player</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddPlayer(false)
                        setAddPlayerMode('select')
                        setSelectedPlayerId('')
                        setNewPlayerName('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <Button
                        variant={addPlayerMode === 'select' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAddPlayerMode('select')}
                      >
                        Select Existing Player
                      </Button>
                      <Button
                        variant={addPlayerMode === 'new' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAddPlayerMode('new')}
                      >
                        Add New Player
                      </Button>
                    </div>

                    {addPlayerMode === 'select' ? (
                      <div className="space-y-2">
                        <Label>Select Player</Label>
                        <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a player..." />
                          </SelectTrigger>
                          <SelectContent>
                            {nonParticipatingPlayers.map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {player.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {nonParticipatingPlayers.length === 0 && (
                          <p className="text-sm text-gray-500">
                            All store players are already participating in the league
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="new-player-name">New Player Name</Label>
                        <Input
                          id="new-player-name"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          placeholder="Enter player name"
                        />
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button
                        onClick={handleAddPlayer}
                        disabled={
                          (addPlayerMode === 'select' && !selectedPlayerId) ||
                          (addPlayerMode === 'new' && !newPlayerName.trim())
                        }
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Player
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 