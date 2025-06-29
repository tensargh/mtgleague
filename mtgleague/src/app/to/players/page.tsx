'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users, Plus, Loader2, Trash2, Eye, EyeOff, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

interface Player {
  id: string
  name: string
  store_id: string
  visibility: 'public' | 'private'
  deleted_at?: string
  created_at: string
}

interface Store {
  id: string
  name: string
}

export default function PlayersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<Store | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showDeletedPlayers, setShowDeletedPlayers] = useState(false)
  const [formData, setFormData] = useState({
    name: ''
  })

  useEffect(() => {
    loadData()
  }, [])

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

      // Get store information
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeAssignments[0].store_id)

      if (storeError || !storeData || storeData.length === 0) {
        toast.error('Failed to load store information')
        return
      }

      setStore(storeData[0])

      // Load players for this store (including deleted ones for TO view)
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('store_id', storeData[0].id)
        .order('name', { ascending: true })

      if (playersError) {
        console.error('Error loading players:', playersError)
        toast.error('Failed to load players')
        return
      }

      setPlayers(playersData || [])

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!store) {
      toast.error('Store information not available')
      return
    }

    if (!formData.name.trim()) {
      toast.error('Please enter a player name')
      return
    }

    setSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('players')
        .insert({
          store_id: store.id,
          name: formData.name.trim(),
          visibility: 'public'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating player:', error)
        toast.error('Failed to create player')
        return
      }

      toast.success('Player created successfully!')
      setCreateDialogOpen(false)
      setFormData({ name: '' })
      loadData() // Refresh the list
    } catch (error) {
      console.error('Error creating player:', error)
      toast.error('Failed to create player')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSoftDeletePlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to delete ${playerName}? The player will be hidden but can be restored later.`)) {
      return
    }

    try {
      const { error } = await supabase
        .rpc('soft_delete_player', { player_id: playerId })

      if (error) {
        console.error('Error soft deleting player:', error)
        toast.error('Failed to delete player')
        return
      }

      toast.success('Player deleted successfully!')
      loadData() // Refresh the list
    } catch (error) {
      console.error('Error soft deleting player:', error)
      toast.error('Failed to delete player')
    }
  }

  const handleRestorePlayer = async (playerId: string, playerName: string) => {
    try {
      const { error } = await supabase
        .rpc('restore_player', { player_id: playerId })

      if (error) {
        console.error('Error restoring player:', error)
        toast.error('Failed to restore player')
        return
      }

      toast.success(`${playerName} restored successfully!`)
      loadData() // Refresh the list
    } catch (error) {
      console.error('Error restoring player:', error)
      toast.error('Failed to restore player')
    }
  }

  const handleToggleVisibility = async (playerId: string, currentVisibility: 'public' | 'private') => {
    const newVisibility = currentVisibility === 'public' ? 'private' : 'public'
    
    try {
      const { error } = await supabase
        .from('players')
        .update({ visibility: newVisibility })
        .eq('id', playerId)

      if (error) {
        console.error('Error updating player visibility:', error)
        toast.error('Failed to update player visibility')
        return
      }

      toast.success(`Player visibility updated to ${newVisibility}`)
      loadData() // Refresh the list
    } catch (error) {
      console.error('Error updating player visibility:', error)
      toast.error('Failed to update player visibility')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading players...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Players</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage players for {store?.name}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-deleted"
              checked={showDeletedPlayers}
              onCheckedChange={(checked: boolean) => setShowDeletedPlayers(checked)}
            />
            <Label htmlFor="show-deleted">Show deleted players</Label>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Player
          </Button>
        </div>
      </div>

      {/* Players List */}
      {(() => {
        const activePlayers = players.filter(p => !p.deleted_at)
        const deletedPlayers = players.filter(p => p.deleted_at)
        const playersToShow = showDeletedPlayers ? players : activePlayers
        
        if (playersToShow.length === 0) {
          return (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {showDeletedPlayers ? 'No deleted players' : 'No players yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {showDeletedPlayers 
                    ? 'No players have been deleted yet.'
                    : 'Add your first player to start managing your league.'
                  }
                </p>
                {!showDeletedPlayers && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Player
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playersToShow.map((player) => {
              const isDeleted = !!player.deleted_at
              const displayName = isDeleted ? "Deleted Player" : player.name
              
              return (
                <Card 
                  key={player.id} 
                  className={`hover:shadow-lg transition-shadow ${
                    isDeleted ? 'opacity-60 border-red-200 dark:border-red-800' : ''
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{displayName}</span>
                      {!isDeleted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleVisibility(player.id, player.visibility)}
                          className="h-6 w-6 p-0"
                          title={`Visibility: ${player.visibility}`}
                        >
                          {player.visibility === 'public' ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {isDeleted ? (
                        <span className="text-red-600">Deleted {new Date(player.deleted_at!).toLocaleDateString()}</span>
                      ) : (
                        <>
                          Added {new Date(player.created_at).toLocaleDateString()}
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            player.visibility === 'public' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {player.visibility}
                          </span>
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end space-x-2">
                      {isDeleted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestorePlayer(player.id, player.name)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restore
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSoftDeletePlayer(player.id, player.name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )
      })()}

      {/* Create Player Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
            <DialogDescription>
              Add a new player to {store?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePlayer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Player Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter player name"
                required
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
                    Adding...
                  </>
                ) : (
                  'Add Player'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 