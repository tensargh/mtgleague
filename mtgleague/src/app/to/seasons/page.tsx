'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trophy, Plus, Calendar, Users, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Season {
  id: string
  name: string
  total_legs: number
  best_legs_count: number
  status: 'active' | 'completed'
  created_at: string
  completed_at?: string
}

interface Store {
  id: string
  name: string
  address: string
}

export default function SeasonsPage() {
  const router = useRouter()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    total_legs: 10,
    best_legs_count: 7
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login')
        return
      }

      // Debug: Check if user has any store assignments
      const { data: debugAssignments, error: debugError } = await supabase
        .from('store_tos')
        .select('*')
        .eq('user_id', authUser.id)

      console.log('Debug - User store assignments:', debugAssignments, 'Debug error:', debugError)

      // Load TO's assigned stores (same approach as dashboard)
      const { data: storeAssignments } = await supabase
        .from('store_tos')
        .select('store_id')
        .eq('user_id', authUser.id)

      if (!storeAssignments || storeAssignments.length === 0) {
        console.warn('No store assignments found for the user')
        toast.error('No store assignment found for this user')
        return
      }

      // Get store information for TO (second query)
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeAssignments[0].store_id)

      console.log('Store data:', storeData, 'Store error:', storeError)

      if (storeError) {
        console.error('Error loading store data:', storeError)
        toast.error('Failed to load store information')
        return
      }

      if (!storeData || storeData.length === 0) {
        console.error('No store data found')
        toast.error('Store information not available')
        return
      }

      const storeInfo = storeData[0]
      setStore(storeInfo)

      // Load seasons for this store
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('seasons')
        .select('*')
        .eq('store_id', storeInfo.id)
        .order('created_at', { ascending: false })

      if (!seasonsError) {
        setSeasons(seasonsData || [])
      } else {
        console.error('Error loading seasons:', seasonsError)
        toast.error('Failed to load seasons')
      }

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!store) {
      toast.error('Store information not available')
      return
    }

    if (!formData.name.trim()) {
      toast.error('Please enter a season name')
      return
    }

    if (formData.total_legs < formData.best_legs_count) {
      toast.error('Total legs must be greater than or equal to best legs count')
      return
    }

    setSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('seasons')
        .insert({
          store_id: store.id,
          name: formData.name.trim(),
          total_legs: formData.total_legs,
          best_legs_count: formData.best_legs_count,
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating season:', error)
        toast.error('Failed to create season')
        return
      }

      toast.success('Season created successfully!')
      setCreateDialogOpen(false)
      setFormData({ name: '', total_legs: 10, best_legs_count: 7 })
      loadData() // Refresh the list
    } catch (error) {
      console.error('Error creating season:', error)
      toast.error('Failed to create season')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600">Active</Badge>
      case 'completed':
        return <Badge variant="outline" className="text-green-600">Completed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading seasons...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Seasons</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage leagues and seasons for {store?.name}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Season
        </Button>
      </div>

      {/* Seasons List */}
      {seasons.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No seasons yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first season to start managing leagues and tournaments.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Season
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seasons.map((season) => (
            <Card key={season.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/to/legs?season=${season.id}`)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{season.name}</CardTitle>
                  {getStatusBadge(season.status)}
                </div>
                <CardDescription>
                  Created {new Date(season.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Legs:</span>
                    <span className="font-medium">{season.total_legs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Best Legs Count:</span>
                    <span className="font-medium">{season.best_legs_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="font-medium capitalize">{season.status}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    Manage Legs
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Season Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Season</DialogTitle>
            <DialogDescription>
              Create a new league season for {store?.name}. A season typically has 10 legs with the best 7 results counting.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSeason} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Season Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Spring 2024 League"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_legs">Total Legs</Label>
              <Input
                id="total_legs"
                type="number"
                min="1"
                max="20"
                value={formData.total_legs}
                onChange={(e) => setFormData(prev => ({ ...prev, total_legs: parseInt(e.target.value) || 10 }))}
                required
              />
              <p className="text-xs text-gray-500">
                The total number of legs in this season (default: 10)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="best_legs_count">Best Legs Count</Label>
              <Input
                id="best_legs_count"
                type="number"
                min="1"
                max={formData.total_legs}
                value={formData.best_legs_count}
                onChange={(e) => setFormData(prev => ({ ...prev, best_legs_count: parseInt(e.target.value) || 7 }))}
                required
              />
              <p className="text-xs text-gray-500">
                Number of best leg results that count towards final standings (default: 7)
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
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
                  'Create Season'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 