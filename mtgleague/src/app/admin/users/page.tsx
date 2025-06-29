'use client'

import { useState, useEffect } from 'react'
import { db, User, Invite, Store } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Plus, Users, Mail, Shield, Trash2, ArrowUp, ArrowDown, Copy, Check, Trophy } from 'lucide-react'
import { toast } from 'sonner'

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [showAllInvites, setShowAllInvites] = useState(false)
  const [inviteType, setInviteType] = useState<'admin' | 'tournament_organiser' | null>(null)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'tournament_organiser' as 'admin' | 'tournament_organiser',
    storeId: '' // For TO invites
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!loading) {
      loadAllInvites()
    }
  }, [showAllInvites])

  const loadData = async () => {
    try {
      const [usersData, storesData] = await Promise.all([
        db.getUsers(),
        db.getStores()
      ])
      
      console.log('Loaded stores:', storesData)
      
      // Load invites based on toggle state
      const invitesData = showAllInvites 
        ? await db.getInvites() 
        : await db.getActiveInvites()
      
      setUsers(usersData)
      setInvites(invitesData)
      setStores(storesData)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load users and invites')
    } finally {
      setLoading(false)
    }
  }

  const loadAllInvites = async () => {
    try {
      const invitesData = await db.getInvites()
      setInvites(invitesData)
    } catch (error) {
      console.error('Failed to load all invites:', error)
      toast.error('Failed to load all invites')
    }
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form based on invite type
    if (inviteType === 'tournament_organiser' && !inviteForm.storeId) {
      toast.error('Please select a store for Tournament Organizer invites')
      return
    }
    
    setSubmitting(true)

    try {
      const invite = await db.createInvite(inviteForm.email, inviteForm.role, inviteForm.storeId || undefined)
      
      // Generate invite link
      const inviteLink = `${window.location.origin}/invite/${invite.token}`
      
      // Send email invitation
      const emailResponse = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteForm.email,
          role: inviteForm.role,
          inviteLink: inviteLink,
          storeId: inviteForm.storeId // Include store info for TO invites
        }),
      })

      if (emailResponse.ok) {
        toast.success(`Invite sent to ${inviteForm.email}`)
      } else {
        // If email fails, show the link as fallback
        const emailError = await emailResponse.json()
        console.log('Email sending failed:', emailError)
        
        if (emailError.error === 'Email service not configured' || emailError.error?.includes('testing emails')) {
          toast.success(`Invite created! Email not sent (domain not verified), but here's the link: ${inviteLink}`)
        } else {
          toast.success(`Invite created! Email failed, but here's the link: ${inviteLink}`)
        }
      }
      
      setInviteForm({ email: '', role: 'tournament_organiser', storeId: '' })
      setInviteType(null)
      setInviteDialogOpen(false)
      loadData() // Refresh the list
    } catch (error: any) {
      toast.error(error.message || 'Failed to create invite')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePromoteUser = async (userId: string) => {
    try {
      await db.changeUserRole(userId, 'admin')
      toast.success('User promoted to admin')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to promote user')
    }
  }

  const handleDemoteUser = async (userId: string) => {
    try {
      await db.changeUserRole(userId, 'tournament_organiser')
      toast.success('Admin demoted to TO')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to demote user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      await db.deleteUser(userId)
      toast.success('User deleted')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user')
    }
  }

  const handleRevokeInvite = async (inviteId: string, email: string) => {
    if (!confirm(`Are you sure you want to revoke the invite for ${email}? This action cannot be undone.`)) {
      return
    }

    try {
      console.log('UI: Attempting to revoke invite:', inviteId, 'for email:', email)
      const result = await db.revokeInvite(inviteId)
      console.log('UI: Revoke result:', result)
      
      if (result) {
        toast.success('Invite revoked')
        
        // Refresh invites based on current view state
        if (showAllInvites) {
          await loadAllInvites()
        } else {
          // For active invites view, reload just the invites
          setInvites([]) // Clear state first
          const invitesData = await db.getActiveInvites()
          console.log('Refreshed active invites count:', invitesData.length)
          setInvites(invitesData)
        }
      } else {
        toast.error('Failed to revoke invite - no result returned')
      }
    } catch (error: any) {
      console.error('UI: Error revoking invite:', error)
      toast.error(error.message || 'Failed to revoke invite')
    }
  }

  const handleResendInvite = async (invite: Invite) => {
    try {
      // Generate invite link
      const inviteLink = `${window.location.origin}/invite/${invite.token}`
      
      // Send email invitation
      const emailResponse = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: invite.email,
          role: invite.role,
          inviteLink: inviteLink,
          storeId: invite.store_id
        }),
      })

      if (emailResponse.ok) {
        toast.success(`Invite resent to ${invite.email}`)
      } else {
        toast.error('Failed to resend invite email')
      }
    } catch (error: any) {
      console.error('Error resending invite:', error)
      toast.error(error.message || 'Failed to resend invite')
    }
  }

  const copyInviteLink = async (token: string) => {
    const inviteLink = `${window.location.origin}/invite/${token}`
    try {
      await navigator.clipboard.writeText(inviteLink)
      toast.success('Invite link copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy link:', error)
      toast.error('Failed to copy link')
    }
  }

  const getRoleBadge = (role: string, cannotBeDeleted: boolean) => {
    const variant = role === 'admin' ? 'default' : 'secondary'
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {role === 'admin' ? <Shield className="h-3 w-3" /> : <Users className="h-3 w-3" />}
        {role.toUpperCase()}
        {cannotBeDeleted && <span className="text-xs">(Protected)</span>}
      </Badge>
    )
  }

  const getInviteStatus = (invite: Invite) => {
    if (invite.accepted) {
      return <Badge variant="outline" className="text-green-600">Accepted</Badge>
    }
    if (new Date(invite.expires_at) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>
    }
    return <Badge variant="secondary">Pending</Badge>
  }

  const getInviteActions = (invite: Invite) => {
    if (invite.accepted) {
      return <div className="text-sm text-muted-foreground">Already accepted</div>
    }
    if (new Date(invite.expires_at) < new Date()) {
      return <div className="text-sm text-muted-foreground">Expired</div>
    }
    return (
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => copyInviteLink(invite.token)}
        >
          <Copy className="mr-1 h-3 w-3" />
          Copy Invite Link
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleRevokeInvite(invite.id, invite.email)}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Revoke
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and send invites</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => {
              setInviteType('admin')
              setInviteForm({ email: '', role: 'admin', storeId: '' })
              setInviteDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Invite Admin
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setInviteType('tournament_organiser')
              setInviteForm({ email: '', role: 'tournament_organiser', storeId: '' })
              setInviteDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Invite TO
          </Button>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Send {inviteType === 'admin' ? 'Admin' : 'Tournament Organizer'} Invite
              </DialogTitle>
              <DialogDescription>
                Send an invitation to join the platform as a {inviteType === 'admin' ? 'Administrator' : 'Tournament Organizer'}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              {inviteType === 'tournament_organiser' && (
                <div className="space-y-2">
                  <Label htmlFor="store">Store</Label>
                  <Select
                    value={inviteForm.storeId}
                    onValueChange={(value) => setInviteForm(prev => ({ ...prev, storeId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Tournament Organizers must be assigned to a specific store.
                  </p>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setInviteDialogOpen(false)
                    setInviteType(null)
                    setInviteForm({ email: '', role: 'tournament_organiser', storeId: '' })
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Invite
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Section */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
          <CardDescription>Manage existing users and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No users found</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getRoleBadge(user.role, user.cannot_be_deleted ?? false)}
                  </div>
                  <div className="flex items-center space-x-2">
                    {user.role === 'tournament_organiser' && !(user.cannot_be_deleted ?? false) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePromoteUser(user.id)}
                      >
                        <ArrowUp className="mr-1 h-3 w-3" />
                        Promote
                      </Button>
                    )}
                    {user.role === 'admin' && !(user.cannot_be_deleted ?? false) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDemoteUser(user.id)}
                      >
                        <ArrowDown className="mr-1 h-3 w-3" />
                        Demote
                      </Button>
                    )}
                    {!user.cannot_be_deleted && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invites Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                {showAllInvites ? 'All Invites' : 'Active Invites'} ({invites.length})
              </CardTitle>
              <CardDescription>
                {showAllInvites ? 'All sent invitations including expired and accepted' : 'Pending invitations that can still be accepted'}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="show-all" className="text-sm">Show all invites</Label>
              <input
                id="show-all"
                type="checkbox"
                checked={showAllInvites}
                onChange={(e) => setShowAllInvites(e.target.checked)}
                className="rounded"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No invites found</p>
          ) : (
            <div className="space-y-4">
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Sent {new Date(invite.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getRoleBadge(invite.role, false)}
                    {getInviteStatus(invite)}
                  </div>
                  <div className="flex items-center space-x-2">
                    {!invite.accepted && new Date(invite.expires_at) > new Date() && (
                      <div className="text-sm text-muted-foreground">
                        Expires {new Date(invite.expires_at).toLocaleDateString()}
                      </div>
                    )}
                    {getInviteActions(invite)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 