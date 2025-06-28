# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Supabase Configuration
# Get these values from your Supabase project dashboard
# Settings → API → Project URL and API keys

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key_here

# Service role key (for server-side operations only)
# Keep this secret and never expose in client-side code
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Optional: Database connection string (if needed for direct DB access)
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## How to Get These Values

### 1. Supabase Project URL
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "Project URL" (starts with `https://`)

### 2. Supabase Anon Key
1. In the same Settings → API page
2. Copy the "anon public" key (starts with `eyJ`)

### 3. Supabase Service Role Key
1. In Settings → API
2. Copy the "service_role" key (starts with `eyJ`)
3. **Keep this secret** - never commit it to your repository

## Security Notes

- **Never commit** `.env.local` to your repository
- The `.env.local` file is automatically ignored by Git in Next.js projects
- Use different keys for development and production
- Rotate keys immediately if they are ever exposed

## Production Deployment

For production (Vercel), add these same environment variables in:
1. Vercel project dashboard
2. Settings → Environment Variables
3. Add each variable with the same names as above 