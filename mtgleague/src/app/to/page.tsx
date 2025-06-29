'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Calendar, Users, Store, Plus } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface User {
  id: string
  email: string
  role: string
  created_at: string
  cannot_be_deleted: boolean
}

interface Store {
  id: string
  name: string
  address: string
  created_at: string
}

export default function TODashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSeasons, setActiveSeasons] = useState(0)
  const [upcomingLegs, setUpcomingLegs] = useState(0)
  const [totalPlayers, setTotalPlayers] = useState(0)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      console.log('Loading user data...')
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        console.log('No auth user found, redirecting to login')
        router.push('/login')
        return
      }

      console.log('Auth user found:', authUser.email)

      // Get user data from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userError || !userData) {
        console.error('User not found:', userError)
        router.push('/login')
        return
      }

      console.log('User data loaded:', userData)

      // Check if user is a TO
      if (userData.role !== 'tournament_organiser') {
        console.log('User is not a TO, role:', userData.role)
        if (userData.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/login')
        }
        return
      }

      console.log('User is a TO, setting user data')
      setUser(userData)

      // Load TO's assigned stores
      const { data: storeAssignments } = await supabase
        .from('store_tos')
        .select('store_id')
        .eq('user_id', authUser.id)

      console.log('Store assignments:', storeAssignments)

      if (!storeAssignments || storeAssignments.length === 0) {
        console.warn('No store assignments found for the user')
        setStore(null)
        return
      }

      // Get store information for TO
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeAssignments[0].store_id)

      console.log('Store data:', storeData, 'Store error:', storeError)

      if (!storeError && storeData && storeData.length > 0) {
        console.log('Setting store data:', storeData[0])
        setStore(storeData[0])
        
        // Load stats for this store
        await loadStoreStats(storeData[0].id)
      }

    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadStoreStats = async (storeId: string) => {
    try {
      // Load active seasons count
      const { count: seasonsCount } = await supabase
        .from('seasons')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .eq('status', 'active')

      setActiveSeasons(seasonsCount || 0)

      // Load upcoming legs count (scheduled legs)
      const { count: legsCount } = await supabase
        .from('legs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .in('season_id', (
          await supabase
            .from('seasons')
            .select('id')
            .eq('store_id', storeId)
        ).data?.map(s => s.id) || [])

      setUpcomingLegs(legsCount || 0)

      // Load total players count
      const { count: playersCount } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId)

      setTotalPlayers(playersCount || 0)

    } catch (error) {
      console.error('Error loading store stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.email?.split('@')[0]}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your tournaments and events at {store?.name || 'your assigned store'}.
        </p>
      </div>

      {/* Store Information */}
      {store && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Store className="h-5 w-5" />
              <span>Store Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Store Name</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{store.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
                <p className="text-gray-900 dark:text-white">{store.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Seasons</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSeasons}</div>
            <p className="text-xs text-muted-foreground">
              {activeSeasons === 1 ? '1 active season' : `${activeSeasons} active seasons`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Legs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingLegs}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingLegs === 1 ? '1 upcoming leg' : `${upcomingLegs} upcoming legs`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlayers}</div>
            <p className="text-xs text-muted-foreground">
              {totalPlayers === 1 ? '1 player registered' : `${totalPlayers} players registered`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/to/seasons">
              <Button variant="outline" className="h-20 w-full flex flex-col items-center justify-center space-y-2">
                <Trophy className="h-6 w-6" />
                <span>Create Season</span>
              </Button>
            </Link>
            <Link href="/to/legs">
              <Button variant="outline" className="h-20 w-full flex flex-col items-center justify-center space-y-2">
                <Calendar className="h-6 w-6" />
                <span>Manage Legs</span>
              </Button>
            </Link>
            <Link href="/to/players">
              <Button variant="outline" className="h-20 w-full flex flex-col items-center justify-center space-y-2">
                <Users className="h-6 w-6" />
                <span>Manage Players</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Features that are currently in development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-green-600 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Leg result entry and management ✓</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Top 8 tournament management</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Season standings and leaderboards</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Store CMS and announcements</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 