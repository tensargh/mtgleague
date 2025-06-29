'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users, Plus, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Player {
  id: string
  name: string
  store_id: string
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

      // Load players for this store
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

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to delete ${playerName}? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)

      if (error) {
        console.error('Error deleting player:', error)
        toast.error('Failed to delete player')
        return
      }

      toast.success('Player deleted successfully!')
      loadData() // Refresh the list
    } catch (error) {
      console.error('Error deleting player:', error)
      toast.error('Failed to delete player')
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
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Player
        </Button>
      </div>

      {/* Players List */}
      {players.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No players yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add your first player to start managing your league.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Player
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <Card key={player.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{player.name}</CardTitle>
                <CardDescription>
                  Added {new Date(player.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePlayer(player.id, player.name)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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