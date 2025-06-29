'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Loader2, Trophy, Users, Calculator, Plus, UserPlus } from 'lucide-react'
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
  is_new_player?: boolean
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
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [addPlayerMode, setAddPlayerMode] = useState<'select' | 'new'>('select')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('')
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

      // Get all players from this store
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('store_id', storeData.id)
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
        // Use the logic for new legs - show players from previous legs
        playersToShow = leaguePlayers
        console.log('League players to show:', playersToShow)
      }

      // Set the participating players state
      setParticipatingPlayers(playersToShow)

      // Initialize player results directly
      const initialResults: PlayerResult[] = playersToShow.map(player => {
        const existingResult = existingResults?.find(r => r.player_id === player.id)
        console.log(`Setting up result for ${player.name}:`, existingResult)
        return {
          player_id: player.id,
          player_name: player.name,
          wins: existingResult?.wins || 0,
          draws: existingResult?.draws || 0,
          losses: existingResult?.losses || 0,
          points: existingResult?.points || 0,
          participated: existingResult ? existingResult.participated : false
        }
      })

      console.log('Initial results set up:', initialResults)
      console.log('Players to show count:', playersToShow.length)
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

  const handleAddPlayer = () => {
    if (addPlayerMode === 'select' && selectedPlayerId) {
      const selectedPlayer = allStorePlayers.find(p => p.id === selectedPlayerId)
      if (selectedPlayer) {
        // Add existing player to results
        setPlayerResults(prev => [...prev, {
          player_id: selectedPlayer.id,
          player_name: selectedPlayer.name,
          wins: 0,
          draws: 0,
          losses: 0,
          points: 0,
          participated: true
        }])
        setShowAddPlayer(false)
        setSelectedPlayerId('')
      }
    } else if (addPlayerMode === 'new' && newPlayerName.trim()) {
      // Add new player to results (will be saved to store when leg is saved)
      const tempId = `new_${Date.now()}`
      setPlayerResults(prev => [...prev, {
        player_id: tempId,
        player_name: newPlayerName.trim(),
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        participated: true,
        is_new_player: true
      }])
      setShowAddPlayer(false)
      setNewPlayerName('')
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
    setSaving(true)

    try {
      // First, create any new players
      const newPlayers = playerResults.filter(result => result.is_new_player)
      const newPlayerIds: { [tempId: string]: string } = {}

      for (const newPlayer of newPlayers) {
        const { data: createdPlayer, error } = await supabase
          .from('players')
          .insert({
            store_id: store!.id,
            name: newPlayer.player_name,
            visibility: 'public'
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating new player:', error)
          toast.error(`Failed to create player ${newPlayer.player_name}`)
          return
        }

        newPlayerIds[newPlayer.player_id] = createdPlayer.id
      }

      // Prepare data for upsert, replacing temp IDs with real IDs
      const resultsToSave = playerResults.map(result => ({
        leg_id: legId,
        player_id: result.is_new_player ? newPlayerIds[result.player_id] : result.player_id,
        wins: result.participated ? result.wins : 0,
        draws: result.participated ? result.draws : 0,
        losses: result.participated ? result.losses : 0,
        points: result.participated ? result.points : 0,
        participated: result.participated
      }))

      // Upsert all results
      const { error: upsertError } = await supabase
        .from('leg_results')
        .upsert(resultsToSave, { onConflict: 'leg_id,player_id' })

      if (upsertError) {
        console.error('Error saving results:', upsertError)
        toast.error('Failed to save results')
        return
      }

      // Update leg status to completed
      const { error: updateError } = await supabase
        .from('legs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', legId)

      if (updateError) {
        console.error('Error updating leg status:', updateError)
        toast.error('Failed to update leg status')
        return
      }

      toast.success('Leg results saved successfully!')
      router.push('/to/legs')

    } catch (error) {
      console.error('Error saving results:', error)
      toast.error('Failed to save results')
    } finally {
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
              {leg.name} - Results
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Leg Name</Label>
              <p className="text-lg font-semibold">{leg.name}</p>
            </div>
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
                    {result.is_new_player && (
                      <Badge variant="secondary" className="text-xs">
                        New Player
                      </Badge>
                    )}
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