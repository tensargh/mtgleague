'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy, Store, MapPin, Users, Calendar, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface Store {
  id: string
  name: string
  address: string
  logo_url?: string
  cms_details?: string
  created_at: string
}

interface Player {
  id: string
  name: string
  email?: string
}

interface LeagueLeg {
  id: string
  leg_number: number
  date: string
  status: 'upcoming' | 'active' | 'completed'
}

interface PlayerScore {
  player_id: string
  leg_id: string
  score: number | null
  played: boolean
}

export default function StoreDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const storeId = params.id as string

  const [store, setStore] = useState<Store | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [legs, setLegs] = useState<LeagueLeg[]>([])
  const [scores, setScores] = useState<PlayerScore[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
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

      // Load current league data (mock data for now)
      await loadLeagueData()

    } catch (error) {
      console.error('Error loading store data:', error)
      toast.error('Failed to load store data')
    } finally {
      setLoading(false)
    }
  }

  const loadLeagueData = async () => {
    // Mock data for demonstration
    // In a real implementation, this would come from your database
    const mockPlayers: Player[] = [
      { id: '1', name: 'John Smith', email: 'john@example.com' },
      { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com' },
      { id: '3', name: 'Mike Davis', email: 'mike@example.com' },
      { id: '4', name: 'Emily Wilson', email: 'emily@example.com' },
      { id: '5', name: 'David Brown', email: 'david@example.com' },
    ]

    const mockLegs: LeagueLeg[] = [
      { id: '1', leg_number: 1, date: '2024-01-15', status: 'completed' },
      { id: '2', leg_number: 2, date: '2024-01-22', status: 'completed' },
      { id: '3', leg_number: 3, date: '2024-01-29', status: 'completed' },
      { id: '4', leg_number: 4, date: '2024-02-05', status: 'active' },
      { id: '5', leg_number: 5, date: '2024-02-12', status: 'upcoming' },
      { id: '6', leg_number: 6, date: '2024-02-19', status: 'upcoming' },
    ]

    const mockScores: PlayerScore[] = [
      // Leg 1 scores
      { player_id: '1', leg_id: '1', score: 15, played: true },
      { player_id: '2', leg_id: '1', score: 12, played: true },
      { player_id: '3', leg_id: '1', score: 18, played: true },
      { player_id: '4', leg_id: '1', score: 10, played: true },
      { player_id: '5', leg_id: '1', score: null, played: false },
      
      // Leg 2 scores
      { player_id: '1', leg_id: '2', score: 14, played: true },
      { player_id: '2', leg_id: '2', score: 16, played: true },
      { player_id: '3', leg_id: '2', score: 11, played: true },
      { player_id: '4', leg_id: '2', score: null, played: false },
      { player_id: '5', leg_id: '2', score: 13, played: true },
      
      // Leg 3 scores
      { player_id: '1', leg_id: '3', score: 17, played: true },
      { player_id: '2', leg_id: '3', score: 15, played: true },
      { player_id: '3', leg_id: '3', score: 12, played: true },
      { player_id: '4', leg_id: '3', score: 14, played: true },
      { player_id: '5', leg_id: '3', score: 16, played: true },
      
      // Leg 4 scores (active)
      { player_id: '1', leg_id: '4', score: 13, played: true },
      { player_id: '2', leg_id: '4', score: null, played: false },
      { player_id: '3', leg_id: '4', score: 15, played: true },
      { player_id: '4', leg_id: '4', score: 11, played: true },
      { player_id: '5', leg_id: '4', score: null, played: false },
    ]

    setPlayers(mockPlayers)
    setLegs(mockLegs)
    setScores(mockScores)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadLeagueData()
    setRefreshing(false)
    toast.success('Data refreshed')
  }

  const getPlayerScore = (playerId: string, legId: string): string => {
    const score = scores.find(s => s.player_id === playerId && s.leg_id === legId)
    if (!score || !score.played) return '-'
    return score.score?.toString() || '-'
  }

  const getPlayerTotalScore = (playerId: string): number => {
    return scores
      .filter(s => s.player_id === playerId && s.played && s.score !== null)
      .reduce((total, score) => total + (score.score || 0), 0)
  }

  const getLegStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-600">Completed</Badge>
      case 'active':
        return <Badge variant="default" className="bg-blue-600">Active</Badge>
      case 'upcoming':
        return <Badge variant="secondary">Upcoming</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleChangeStore = () => {
    localStorage.removeItem('selectedStoreId')
    router.push('/')
  }

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

          {/* Current League Standings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Current League Standings</span>
              </CardTitle>
              <CardDescription>
                League progress and player scores across all legs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {legs.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No league data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-48">Player</TableHead>
                        {legs.map((leg) => (
                          <TableHead key={leg.id} className="text-center">
                            <div className="space-y-1">
                              <div className="font-medium">Leg {leg.leg_number}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(leg.date).toLocaleDateString()}
                              </div>
                              {getLegStatusBadge(leg.status)}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center font-bold">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {players.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium">
                            {player.name}
                          </TableCell>
                          {legs.map((leg) => (
                            <TableCell key={leg.id} className="text-center">
                              {getPlayerScore(player.id, leg.id)}
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-bold">
                            {getPlayerTotalScore(player.id)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* League Information */}
          <Card>
            <CardHeader>
              <CardTitle>League Information</CardTitle>
              <CardDescription>
                Details about the current league format and rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{legs.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Legs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{players.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Players</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {legs.filter(leg => leg.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completed Legs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 