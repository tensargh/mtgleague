'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Season {
  id: string
  name: string
  total_legs: number
  best_legs_count: number
  status: 'active' | 'completed'
  created_at: string
}

interface Store {
  id: string
  name: string
  address: string
}

function Top8PageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const seasonId = searchParams.get('season')
  
  const [loading, setLoading] = useState(true)
  const [season, setSeason] = useState<Season | null>(null)
  const [store, setStore] = useState<Store | null>(null)

  useEffect(() => {
    if (seasonId) {
      loadData()
    }
  }, [seasonId])

  const loadData = async () => {
    if (!seasonId) return

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

      // Load season information
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .eq('id', seasonId)
        .single()

      if (seasonError || !seasonData) {
        toast.error('Failed to load season information')
        return
      }

      setSeason(seasonData)

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
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

  if (!season || !store) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Season not found</p>
          <Button onClick={() => router.push('/to/legs')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Legs
          </Button>
        </div>
      </div>
    )
  }

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
              Top 8 Tournament
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {season.name} • {store.name}
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top 8 Tournament
          </CardTitle>
          <CardDescription>
            This feature is coming soon! The Top 8 tournament will allow you to create a single-elimination bracket for the top 8 players from the season.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Top 8 Tournament
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create brackets, manage matches, and crown a champion!
            </p>
            <p className="text-sm text-gray-500">
              This feature will be implemented in a future update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Top8Page() {
  return (
    <Suspense fallback={null}>
      <Top8PageInner />
    </Suspense>
  );
} 