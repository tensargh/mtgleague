'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Megaphone, ExternalLink } from 'lucide-react'

interface StoreAnnouncement {
  id: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface StoreAnnouncementsDisplayProps {
  storeId: string
}

export default function StoreAnnouncementsDisplay({ storeId }: StoreAnnouncementsDisplayProps) {
  const [announcements, setAnnouncements] = useState<StoreAnnouncement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnnouncements()
  }, [storeId])

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('store_announcements')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading announcements:', error)
        return
      }

      setAnnouncements(data || [])
    } catch (error) {
      console.error('Error loading announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return null // Don't show loading state for announcements
  }

  if (announcements.length === 0) {
    return null // Don't show anything if no announcements
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Megaphone className="h-5 w-5 text-blue-600" />
          <span>Store Announcements</span>
        </CardTitle>
        <CardDescription>
          Latest updates and information from {storeId ? 'the store' : 'this store'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div 
              key={announcement.id}
              className="border-l-4 border-l-blue-500 pl-4 py-2"
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs">
                  {new Date(announcement.updated_at).toLocaleDateString()}
                </Badge>
              </div>
              
              <div 
                className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: announcement.content }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 