'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Store, MapPin, Users, Calendar, Loader2, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface Store {
  id: string
  name: string
  address: string
  created_at: string
}

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [user, setUser] = useState<any>(null)
  const { theme, setTheme } = useTheme();
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    checkAuthAndLoadStores()
  }, [])

  useEffect(() => {
    if (!user && selectedStore) {
      router.push(`/store/${selectedStore.id}`)
    }
  }, [selectedStore, user, router])

  useEffect(() => {
    if (user) {
      setRedirecting(true)
      console.log('Landing page user role:', user.role)
      if (user.role === 'admin') {
        router.replace('/admin')
      } else if (user.role === 'tournament_organiser') {
        router.replace('/to')
      } else {
        router.replace('/login')
      }
    }
  }, [user, router])

  const checkAuthAndLoadStores = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        // Get user role from our users table
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', authUser.id)
          .single()

        if (userData) {
          setUser(userData)
          // Don't redirect here - let the useEffect handle it
        }
      }

      // Load stores for anonymous users
      await loadStores()
    } catch (error) {
      console.error('Auth check error:', error)
      await loadStores()
    } finally {
      setLoading(false)
    }
  }

  const loadStores = async () => {
    try {
      const { data: storesData, error } = await supabase
        .from('stores')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error loading stores:', error)
        toast.error('Failed to load stores')
        return
      }

      setStores(storesData || [])

      // Check for stored store preference
      const storedStoreId = localStorage.getItem('selectedStoreId')
      if (storedStoreId) {
        const storedStore = storesData?.find(store => store.id === storedStoreId)
        if (storedStore) {
          setSelectedStore(storedStore)
        }
      }
    } catch (error) {
      console.error('Error loading stores:', error)
      toast.error('Failed to load stores')
    }
  }

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store)
    localStorage.setItem('selectedStoreId', store.id)
    toast.success(`Selected ${store.name}`)
  }

  const handleChangeStore = () => {
    setSelectedStore(null)
    localStorage.removeItem('selectedStoreId')
  }

  if (redirecting) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
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
              {selectedStore && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleChangeStore}
                >
                  Change Store
                </Button>
              )}
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
        {!selectedStore ? (
          // Store Selection
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Select Your Store
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Choose your local game store to view tournaments, leagues, and events.
              </p>
            </div>

            {stores.length === 0 ? (
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="text-center">No Stores Available</CardTitle>
                  <CardDescription className="text-center">
                    There are currently no stores registered in the system.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store) => (
                  <Card 
                    key={store.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300"
                    onClick={() => handleStoreSelect(store)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Store className="h-6 w-6 text-blue-600" />
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                      <CardTitle className="mt-4">{store.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-4">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{store.address}</span>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStoreSelect(store)
                        }}
                      >
                        Select Store
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Store Details - Redirect to store page
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading store details...</span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Trophy className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-bold">MtgLeague</span>
          </div>
          <p className="text-gray-400">
            The ultimate platform for Magic: The Gathering tournament organization.
          </p>
          <div className="border-t border-gray-800 mt-4 pt-4 text-center text-gray-400">
            <p>&copy; 2024 MtgLeague. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
