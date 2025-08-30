'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Megaphone, Edit, Save, X, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { sanitizeHtml, textToHtml } from '@/lib/sanitize'

interface StoreAnnouncement {
  id: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface StoreAnnouncementsProps {
  storeId?: string
}

export default function StoreAnnouncements({ storeId }: StoreAnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<StoreAnnouncement[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (storeId) {
      loadAnnouncements()
    }
  }, [storeId])

  const loadAnnouncements = async () => {
    if (!storeId) return

    try {
      const { data, error } = await supabase
        .from('store_announcements')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading announcements:', error)
        toast.error('Failed to load announcements')
        return
      }

      setAnnouncements(data || [])
    } catch (error) {
      console.error('Error loading announcements:', error)
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (announcement: StoreAnnouncement) => {
    setEditingId(announcement.id)
    setEditContent(announcement.content)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditContent('')
  }

           const handleSave = async () => {
           if (!storeId || !editingId) return

           setSaving(true)
           try {
             // Convert markdown to HTML, then sanitize
             const htmlContent = textToHtml(editContent)
             const sanitizedContent = sanitizeHtml(htmlContent)

             const { error } = await supabase
               .from('store_announcements')
               .update({
                 content: sanitizedContent,
                 updated_at: new Date().toISOString()
               })
               .eq('id', editingId)

             if (error) {
               console.error('Error updating announcement:', error)
               toast.error('Failed to update announcement')
               return
             }

             toast.success('Announcement updated successfully')
             setEditingId(null)
             setEditContent('')
             loadAnnouncements()
           } catch (error) {
             console.error('Error updating announcement:', error)
             toast.error('Failed to update announcement')
           } finally {
             setSaving(false)
           }
         }

  const handleToggleActive = async (announcement: StoreAnnouncement) => {
    try {
      const { error } = await supabase
        .from('store_announcements')
        .update({ 
          is_active: !announcement.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', announcement.id)

      if (error) {
        console.error('Error toggling announcement:', error)
        toast.error('Failed to update announcement')
        return
      }

      toast.success(`Announcement ${announcement.is_active ? 'deactivated' : 'activated'}`)
      loadAnnouncements()
    } catch (error) {
      console.error('Error toggling announcement:', error)
      toast.error('Failed to update announcement')
    }
  }

  const handleDelete = async (announcement: StoreAnnouncement) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return

    try {
      const { error } = await supabase
        .from('store_announcements')
        .delete()
        .eq('id', announcement.id)

      if (error) {
        console.error('Error deleting announcement:', error)
        toast.error('Failed to delete announcement')
        return
      }

      toast.success('Announcement deleted successfully')
      loadAnnouncements()
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast.error('Failed to delete announcement')
    }
  }

           const handleCreate = async () => {
           if (!storeId) return

           setSaving(true)
           try {
             // Convert markdown to HTML, then sanitize
             const htmlContent = textToHtml(editContent)
             const sanitizedContent = sanitizeHtml(htmlContent)

             const { error } = await supabase
               .from('store_announcements')
               .insert({
                 store_id: storeId,
                 content: sanitizedContent,
                 is_active: true
               })

             if (error) {
               console.error('Error creating announcement:', error)
               toast.error('Failed to create announcement')
               return
             }

             toast.success('Announcement created successfully')
             setEditContent('')
             loadAnnouncements()
           } catch (error) {
             console.error('Error creating announcement:', error)
             toast.error('Failed to create announcement')
           } finally {
             setSaving(false)
           }
         }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">Loading announcements...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Create/Edit Form */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Megaphone className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">
            {editingId ? 'Edit Announcement' : 'Create New Announcement'}
          </span>
        </div>
        
        <Textarea
          placeholder="Enter your announcement... You can use basic formatting and include links to external sites, tickets, etc."
          value={editContent}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)}
          rows={4}
          className="min-h-[100px]"
        />
        
        <div className="flex items-center space-x-2">
          {editingId ? (
            <>
              <Button 
                onClick={handleSave} 
                disabled={saving || !editContent.trim()}
                size="sm"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                size="sm"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleCreate} 
              disabled={saving || !editContent.trim()}
              size="sm"
            >
              {saving ? 'Creating...' : 'Create Announcement'}
            </Button>
          )}
        </div>
        
                       <div className="text-xs text-gray-500">
                 <p>💡 <strong>Tips:</strong></p>
                 <ul className="list-disc list-inside ml-2 space-y-1">
                   <li>Use <strong>**bold**</strong> for important information (will render as bold)</li>
                   <li>Use <em>*italic*</em> for emphasis (will render as italic)</li>
                   <li>Links like https://example.com will automatically become clickable</li>
                   <li>Line breaks will be preserved</li>
                   <li>Content is automatically converted from markdown to HTML</li>
                 </ul>
               </div>
      </div>

      {/* Existing Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Existing Announcements
          </h4>
          
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant={announcement.is_active ? "default" : "secondary"}>
                      {announcement.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(announcement.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(announcement)}
                      title={announcement.is_active ? "Deactivate" : "Activate"}
                    >
                      {announcement.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(announcement)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(announcement)}
                      title="Delete"
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: announcement.content }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {announcements.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No announcements yet. Create your first one above!</p>
        </div>
      )}
    </div>
  )
} 