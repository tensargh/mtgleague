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

# Optional: Base URL for invite links (auto-detected if not set)
# NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Optional: Database connection string (if needed for direct DB access)
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## Base URL Configuration

The application automatically detects the correct base URL for invite links:

### Automatic Detection (Recommended)
- **Local Development**: Uses `http://localhost:3000`
- **Vercel Preview**: Uses `https://your-app.vercel.app` (from `VERCEL_URL`)
- **Vercel Production**: Uses your custom domain or Vercel URL

### Manual Override (Optional)
If you need to override the automatic detection, set `NEXT_PUBLIC_BASE_URL`:
```bash
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
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

### Vercel Environment Variables
Vercel automatically provides:
- `VERCEL_URL` - Your deployment URL
- `VERCEL_ENV` - Environment (`production`, `preview`, `development`)

The app uses these to automatically generate correct invite links. 