'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Megaphone, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import StoreAnnouncements from '@/components/StoreAnnouncements'

export default function AnnouncementsPage() {
  const router = useRouter()
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStoreData()
  }, [])

  const loadStoreData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login')
        return
      }

      // Get TO's assigned store
      const { data: storeAssignments } = await supabase
        .from('store_tos')
        .select('store_id')
        .eq('user_id', authUser.id)

      if (storeAssignments && storeAssignments.length > 0) {
        const { data: storeData } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeAssignments[0].store_id)
          .single()

        if (storeData) {
          setStore(storeData)
        }
      }
    } catch (error) {
      console.error('Error loading store data:', error)
    } finally {
      setLoading(false)
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

  if (!store) {
    return (
      <div className="text-center py-12">
        <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Store Not Found</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Unable to load store information.
        </p>
        <Link href="/to">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Back to Dashboard
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/to">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Store Announcements</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage announcements and updates for {store.name}
          </p>
        </div>
      </div>

      {/* Announcements Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Megaphone className="h-5 w-5 text-blue-600" />
            <span>Announcements Management</span>
          </CardTitle>
          <CardDescription>
            Create and manage announcements that will be displayed on your store page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StoreAnnouncements storeId={store.id} />
        </CardContent>
      </Card>

      {/* Tips and Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Great Announcements</CardTitle>
        </CardHeader>
        <CardContent>
                       <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
               <div className="flex items-start space-x-2">
                 <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                 <span>Use <strong>**bold text**</strong> for important information like dates and times (will render as bold)</span>
               </div>
               <div className="flex items-start space-x-2">
                 <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                 <span>Use <em>*italic text*</em> for emphasis (will render as italic)</span>
               </div>
               <div className="flex items-start space-x-2">
                 <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                 <span>Links like https://example.com will automatically become clickable</span>
               </div>
               <div className="flex items-start space-x-2">
                 <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                 <span>Line breaks will be preserved automatically</span>
               </div>
               <div className="flex items-start space-x-2">
                 <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                 <span>Keep announcements concise and focused on one topic</span>
               </div>
               <div className="flex items-start space-x-2">
                 <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                 <span>Use the active/inactive toggle to control which announcements are visible to the public</span>
               </div>
             </div>
        </CardContent>
      </Card>
    </div>
  )
} 