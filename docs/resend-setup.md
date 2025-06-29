# Resend Email Setup Guide

## Overview
This guide will help you set up Resend.com to send automatic invite emails for your MtgLeague application.

## Step 1: Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

## Step 2: Get API Key
1. After logging in, go to the API Keys section
2. Create a new API key
3. Copy the API key (starts with `re_`)

## Step 3: Configure Environment Variables
Add the API key to your `.env.local` file:
```
RESEND_API_KEY=re_your_api_key_here
```

## Step 4: Verify Domain (Optional but Recommended)
For production use, you should verify your domain:
1. In Resend dashboard, go to Domains
2. Add your domain (e.g., `yourdomain.com`)
3. Follow the DNS verification steps
4. Update the `from` email in `/src/app/api/send-invite/route.ts`:
   ```typescript
   from: 'MtgLeague <noreply@yourdomain.com>'
   ```

## Step 5: Test Setup
1. Start your development server
2. Go to `/admin/users`
3. Send a test invite
4. Check if the email is received

## Free Tier Limits
- **3,000 emails per month** (generous for most use cases)
- **100 emails per day** sending limit
- **No credit card required**

## Troubleshooting
- If emails aren't sending, check the browser console for errors
- Verify your API key is correct
- Make sure your domain is verified (if using custom domain)
- Check Resend dashboard for delivery status

## Fallback
If email sending fails, the system will still show the invite link in a toast notification as a fallback. 