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