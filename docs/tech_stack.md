# Tech Stack Documentation

## Overview
This document outlines the technology choices for the MtgLeague application, focusing on free/low-cost solutions with excellent developer experience.

## Tech Stack Components

### Backend + Database + Auth: Supabase
**Why Supabase:**
- **Free tier**: 50,000 monthly active users, 500MB database, 1GB file storage
- **Built-in OAuth**: Google, Discord, GitHub, and more
- **Real-time subscriptions**: Live updates for standings and results
- **Row Level Security**: Built-in security policies
- **Auto-generated APIs**: REST and GraphQL APIs from database schema
- **PostgreSQL**: Industry-standard database with full SQL capabilities

### Frontend: Next.js 14 (App Router)
**Why Next.js:**
- **Free deployment**: Vercel hosting with generous free tier
- **Server-side rendering**: Better SEO and performance
- **TypeScript support**: Type safety throughout the application
- **Built-in API routes**: Can extend backend functionality if needed
- **App Router**: Latest React patterns and improved performance

### UI Framework: Tailwind CSS + shadcn/ui
**Why this combination:**
- **Tailwind CSS**: Utility-first CSS framework for rapid development
- **shadcn/ui**: High-quality, accessible React components
- **Customizable**: Easy to match your design requirements
- **Mobile-first**: Responsive design out of the box

### State Management: Zustand
**Why Zustand:**
- **Lightweight**: Minimal bundle size
- **Simple API**: Easy to learn and use
- **TypeScript support**: Full type safety
- **Great with Supabase**: Works seamlessly with real-time subscriptions

### Additional Libraries
- **@tanstack/react-query**: Data fetching and caching
- **react-hook-form**: Form handling with validation
- **zod**: Schema validation
- **lucide-react**: Icon library

## Getting Started Guide

### 1. Project Setup

#### Create Next.js Project
```bash
npx create-next-app@latest mtgleague --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd mtgleague
```

#### Install Core Dependencies
```bash
# Supabase
npm install @supabase/supabase-js

# State Management
npm install zustand

# Data Fetching
npm install @tanstack/react-query

# Forms and Validation
npm install react-hook-form @hookform/resolvers zod

# Icons
npm install lucide-react
```

#### Install UI Components
```bash
# Install shadcn/ui CLI
npx shadcn@latest init

# Install common components
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add badge
npx shadcn@latest add avatar
```

### 2. Provider Registration

#### Supabase Setup
1. **Register**: Go to [supabase.com](https://supabase.com) and sign up
2. **Create Project**: 
   - Click "New Project"
   - Choose "Free" tier
   - Select region closest to your users
   - Set database password (save this securely)
3. **Get Credentials**:
   - Go to Settings → API
   - Copy your Project URL and anon public key
   - Save these for environment variables

#### Vercel Setup
1. **Register**: Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. **Connect Repository**: 
   - Push your code to GitHub
   - Import project in Vercel dashboard
   - Vercel will auto-detect Next.js settings

#### OAuth Providers (Optional)
1. **Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs from Supabase

2. **Discord OAuth**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create new application
   - Go to OAuth2 settings
   - Add redirect URI from Supabase

### 2. Provider Registration

#### Step 1: Create GitHub Account (if you don't have one)
1. **Go to GitHub**: [github.com](https://github.com)
2. **Click "Sign up"** and create an account
3. **Verify your email** address
4. **Set up two-factor authentication** (recommended for security)

#### Step 2: Supabase Setup
1. **Create Supabase Account**:
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project" or "Sign up"
   - Choose "Continue with GitHub" (recommended)
   - Authorize Supabase to access your GitHub account

2. **Create Your First Project**:
   - Click "New Project" button
   - **Organization**: Select "Personal" (or create one if needed)
   - **Name**: Enter "mtgleague" or your preferred name
   - **Database Password**: Create a strong password (save this securely!)
   - **Region**: Choose closest to your users (e.g., "West Europe" for UK)
   - **Pricing Plan**: Select "Free" tier
   - Click "Create new project"

3. **Wait for Setup** (2-3 minutes):
   - Supabase will create your database and API
   - You'll see a green checkmark when ready

4. **Get Your API Keys**:
   - In your project dashboard, click **"Settings"** (gear icon) in the left sidebar
   - Click **"API"** in the submenu
   - **Project URL**: Copy the URL (starts with `https://`)
   - **anon public**: Copy this key (starts with `eyJ`)
   - **service_role**: Copy this key (starts with `eyJ`) - keep this secret!

5. **Configure Authentication URLs**:
   - Click **"Authentication"** in the left sidebar
   - Click **"URL Configuration"**
   - **Site URL**: Enter `http://localhost:3000` (for development)
   - **Redirect URLs**: Add these one by one:
     ```
     http://localhost:3000/auth/callback
     http://localhost:3000/auth/confirm
     http://localhost:3000/auth/reset-password
     ```
   - Click **"Save"**

#### Step 3: Vercel Setup
1. **Create Vercel Account**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign up"
   - Choose "Continue with GitHub"
   - Authorize Vercel to access your GitHub account

2. **Import Your Repository**:
   - In Vercel dashboard, click **"New Project"**
   - Click **"Import Git Repository"**
   - Find your `mtgleague` repository and click **"Import"**
   - **Project Name**: Keep default or change to "mtgleague"
   - **Framework Preset**: Should auto-detect "Next.js"
   - **Root Directory**: Leave as `./` (default)
   - **Build Command**: Leave as `npm run build` (default)
   - **Output Directory**: Leave as `.next` (default)
   - **Install Command**: Leave as `npm install` (default)
   - Click **"Deploy"**

3. **Wait for First Deployment** (2-3 minutes):
   - Vercel will build and deploy your project
   - You'll get a URL like `https://mtgleague-abc123.vercel.app`

4. **Configure Environment Variables**:
   - In your Vercel project dashboard, click **"Settings"**
   - Click **"Environment Variables"**
   - Add these variables one by one:
     - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
     - **Value**: Your Supabase Project URL
     - **Environment**: Select "Production", "Preview", and "Development"
     - Click **"Add"**
     - Repeat for:
       - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (your anon public key)
       - `SUPABASE_SERVICE_ROLE_KEY` (your service role key)

5. **Redeploy with Environment Variables**:
   - Go to **"Deployments"** tab
   - Click **"Redeploy"** on your latest deployment
   - This ensures your environment variables are included

#### Step 4: OAuth Providers (Optional but Recommended)
1. **Google OAuth Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - **Create or Select Project**:
     - Click the project dropdown at the top
     - Click "New Project" or select existing
     - Name it "MtgLeague" or similar
   - **Enable APIs**:
     - Go to "APIs & Services" → "Library"
     - Search for "Google+ API" and click it
     - Click "Enable"
   - **Create OAuth Credentials**:
     - Go to "APIs & Services" → "Credentials"
     - Click "Create Credentials" → "OAuth 2.0 Client IDs"
     - **Application type**: Choose "Web application"
     - **Name**: "MtgLeague Web Client"
     - **Authorized redirect URIs**: Add your Supabase callback URL:
       ```
       https://glsxnptdvxreazytaqzn.supabase.co/auth/v1/callback
       ```
       (Replace `your-project-ref` with your actual Supabase project reference)
     - Click "Create"
     - **Copy the Client ID and Client Secret** (you'll need these)

2. **Configure Google OAuth in Supabase**:
   - Go back to your Supabase dashboard
   - Go to "Authentication" → "Providers"
   - Find "Google" and click the toggle to enable it
   - **Client ID**: Paste your Google Client ID
   - **Client Secret**: Paste your Google Client Secret
   - Click "Save"

3. **Discord OAuth Setup** (Alternative):
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application"
   - **Name**: "MtgLeague"
   - Click "Create"
   - Go to "OAuth2" in the left sidebar
   - **Redirects**: Add your Supabase callback URL:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
   - **Copy the Client ID and Client Secret**
   - Go back to Supabase and enable Discord provider with these credentials

#### Step 5: Test Your Setup
1. **Test Local Development**:
   - In your local project, create `.env.local` with your Supabase keys
   - Run `npm run dev`
   - Go to `http://localhost:3000`
   - Try signing in with email/password or OAuth

2. **Test Production**:
   - Go to your Vercel URL
   - Test the same authentication flows
   - Check that redirects work properly

3. **Common Issues to Check**:
   - **"Invalid redirect URL"**: Make sure URLs in Supabase match exactly
   - **"Site URL not configured"**: Set Site URL in Supabase Authentication settings
   - **OAuth errors**: Verify Client ID/Secret are correct and redirect URLs match

### 3. Environment Setup

#### Create Environment Files
```bash
# .env.local (for development)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Vercel Environment Variables
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the same variables as above

### 4. Database Schema Setup

#### Create Tables in Supabase
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the schema creation script (based on the data model in PRD)

#### Enable Row Level Security
1. In Supabase dashboard, go to Authentication → Policies
2. Create policies for each table based on user roles
3. Test policies with different user types

#### Row Level Security (RLS) Setup & Testing
**Note:** The schema.sql file already includes comprehensive RLS policies for all tables. Here's how to verify and test them:

1. **Verify RLS is Enabled:**
   - Go to Supabase dashboard → Table Editor
   - Check that "RLS" column shows as "Enabled" for all tables in the Table Editor
   - If not, run: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`

2. **View Existing Policies:**
   - Go to Authentication → Policies
   - You should see policies for each table with names like:
     - "Public can view stores"
     - "Admins can manage stores"
     - "TOs can manage their store players"
     - etc.

3. **Test Policies with Different User Types:**

   **A. Test as Anonymous User:**
   ```sql
   -- Should be able to view public data
   SELECT * FROM stores;
   SELECT * FROM players WHERE visibility = 'public';
   SELECT * FROM seasons WHERE status = 'active';
   
   -- Should NOT be able to insert/update/delete
   INSERT INTO stores (name) VALUES ('Test Store'); -- Should fail
   ```

   **B. Test as Tournament Organiser:**
   ```sql
   -- First, create a test TO user
   INSERT INTO users (email, name, role) 
   VALUES ('to@test.com', 'Test TO', 'tournament_organiser');
   
   -- Assign TO to a store
   INSERT INTO store_tos (store_id, user_id) 
   VALUES ('store-uuid', 'user-uuid');
   
   -- Test TO permissions (run as TO user)
   -- Should be able to manage their assigned store
   SELECT * FROM players WHERE store_id = 'assigned-store-uuid';
   INSERT INTO players (store_id, name) VALUES ('assigned-store-uuid', 'New Player');
   
   -- Should NOT be able to access other stores
   SELECT * FROM players WHERE store_id = 'other-store-uuid'; -- Should return empty
   ```

   **C. Test as Admin:**
   ```sql
   -- Create admin user
   INSERT INTO users (email, name, role) 
   VALUES ('admin@test.com', 'Test Admin', 'admin');
   
   -- Test admin permissions (run as admin user)
   -- Should be able to access everything
   SELECT * FROM stores;
   SELECT * FROM users;
   INSERT INTO stores (name) VALUES ('Admin Created Store');
   ```

4. **Testing Strategy:**
   - **Use Supabase Auth**: Create test users through the Auth dashboard
   - **Use SQL Editor**: Switch between different authenticated users
   - **Test Edge Cases**: Try accessing data across store boundaries
   - **Verify Public Access**: Ensure anonymous users can see appropriate data

5. **Common Test Scenarios:**
   ```sql
   -- Test store isolation for TOs
   -- TO should only see players from their assigned store
   
   -- Test admin override
   -- Admin should see all data regardless of store
   
   -- Test public visibility
   -- Anonymous users should see public players and active seasons
   
   -- Test completed vs active data
   -- Public should see completed legs but not in-progress ones
   ```

6. **Debugging RLS Issues:**
   ```sql
   -- Check current user
   SELECT auth.uid();
   
   -- Check user role
   SELECT role FROM users WHERE id = auth.uid();
   
   -- Check store assignments
   SELECT store_id FROM store_tos WHERE user_id = auth.uid();
   ```

**Recommended Additional Policies (if needed):**
- Add rate limiting policies for public endpoints
- Consider adding audit logging for sensitive operations
- Add policies for soft-delete functionality if needed

### 5. Authentication Setup

#### Configure Auth in Supabase
1. Go to Authentication → Settings
2. Enable email confirmations (optional)
3. Configure OAuth providers (Google, Discord, etc.)
4. Set up redirect URLs

#### Create Auth Context
```typescript
// lib/auth-context.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export const AuthContext = createContext<{
  user: User | null
  loading: boolean
}>({
  user: null,
  loading: true,
})

export const useAuth = () => useContext(AuthContext)
```

### 6. Development Workflow

#### Local Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm start
```

#### Database Migrations
1. Use Supabase CLI for local development
2. Create migrations in `supabase/migrations/`
3. Apply migrations to production via dashboard

### 7. Deployment Checklist

#### Pre-Deployment
- [ ] Environment variables set in Vercel
- [ ] Database schema deployed to Supabase
- [ ] Auth providers configured
- [ ] RLS policies tested
- [ ] Build passes locally

#### Post-Deployment
- [ ] Test authentication flow
- [ ] Verify database connections
- [ ] Check OAuth redirects
- [ ] Test real-time subscriptions
- [ ] Monitor error logs

## Cost Breakdown

### Free Tier Limits
- **Supabase**: 50K users, 500MB DB, 1GB storage
- **Vercel**: 100GB bandwidth, unlimited deployments
- **Total**: $0/month for MVP

### Scaling Costs
- **Supabase Pro**: $25/month (when you exceed free limits)
- **Vercel Pro**: $20/month (if needed for team features)

## Next Steps

1. Set up the project structure
2. Configure Supabase and create database schema
3. Implement authentication flow
4. Build core CRUD operations
5. Add real-time features
6. Deploy and test

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand) 