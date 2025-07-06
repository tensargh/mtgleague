import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  role: 'admin' | 'tournament_organiser'
  created_at: string
  cannot_be_deleted?: boolean
}

export interface Invite {
  id: string
  email: string
  role: 'admin' | 'tournament_organiser'
  store_id?: string
  token: string
  accepted: boolean
  expires_at: string
  created_at: string
  created_by: string
}

export interface Store {
  id: string
  name: string
  created_at: string
}

// Helper functions for database operations
export const db = {
  // User management
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async changeUserRole(targetUserId: string, newRole: 'admin' | 'tournament_organiser'): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase.rpc('change_user_role', {
      target_user_id: targetUserId,
      new_role: newRole,
      admin_user_id: user.id
    })

    if (error) throw error
    return data
  },

  async deleteUser(targetUserId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase.rpc('delete_user', {
      target_user_id: targetUserId,
      admin_user_id: user.id
    })

    if (error) throw error
    return data
  },

  // Invite management
  async createInvite(email: string, role: 'admin' | 'tournament_organiser', storeId?: string): Promise<Invite> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const inviteData: any = {
      email,
      role,
      created_by: user.id
    }

    // Only include store_id for TO invites if it's a valid UUID
    if (role === 'tournament_organiser' && storeId && storeId.trim() !== '') {
      inviteData.store_id = storeId
    }

    console.log('Creating invite with data:', JSON.stringify(inviteData, null, 2))

    const { data, error } = await supabase
      .from('invites')
      .insert(inviteData)
      .select()
      .single()

    if (error) {
      console.error('Error creating invite:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw error
    }

    console.log('Created invite:', data)
    return data
  },

  async getInvites(): Promise<Invite[]> {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getActiveInvites(): Promise<Invite[]> {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('accepted', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getInviteByToken(token: string): Promise<Invite | null> {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token)
      .single()
    
    if (error) throw error
    return data
  },

  async acceptInvite(token: string, email: string, password: string): Promise<any> {
    const { data, error } = await supabase.rpc('accept_invite_and_create_user', {
      invite_token: token,
      user_password: password,
      user_email: email
    })

    if (error) throw error
    return data
  },

  async completeInviteAcceptance(inviteId: string, authUserId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('complete_invite_acceptance', {
      invite_id: inviteId,
      auth_user_id: authUserId
    })

    if (error) throw error
    return data
  },

  async revokeInvite(inviteId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    console.log('Attempting to revoke invite:', inviteId, 'by user:', user.id)

    // Use the database function instead of direct DELETE
    const { data, error } = await supabase.rpc('revoke_invite', {
      invite_id: inviteId,
      admin_user_id: user.id
    })

    if (error) {
      console.error('Error revoking invite:', error)
      throw error
    }

    console.log('Revoke function result:', data)
    return data
  },

  // Store management
  async getStores(): Promise<Store[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data || []
  }
} 