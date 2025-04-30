# LinkStash Pocket

A modern bookmark manager built with React, TypeScript, and Capacitor.

## Features

- Save and organize bookmarks
- Add tags and categories
- Search through your bookmarks
- Responsive design for all devices
- Native mobile app support
- Offline storage with SQLite
- Automatic metadata extraction for links (title, description, thumbnail, etc.)
- Smart category suggestions based on link content

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Building for Production

To build the app for production:

```bash
npm run build
```

## Mobile Development

To run on Android:

```bash
npx cap add android
npx cap sync
npx cap open android
```

## Supabase Edge Functions

This project uses Supabase Edge Functions for server-side link metadata extraction.

### Deploying the Edge Function

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Deploy the metadata extraction function:
   ```bash
   npx supabase functions deploy get-link-metadata
   ```

4. **IMPORTANT**: Enable anonymous access to the function through the Supabase Dashboard:
   - Go to your Supabase project dashboard
   - Navigate to "Edge Functions" in the left sidebar
   - Click on the "get-link-metadata" function
   - Under "Authentication settings" or "JWT verification", turn it OFF
   - Or you can go to "Project Settings" > "API" and copy your anon key for direct access

### Troubleshooting Edge Functions

If you encounter CORS or authentication issues with the Edge Function:

1. **Check JWT verification**: Make sure "JWT verification" is disabled in the function settings
2. **Check CORS headers**: The Edge Function includes proper CORS headers, but they might need adjustments for your specific domain
3. **Direct API access**: You can use the direct fetch method with the anon key:
   ```javascript
   const response = await fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/get-link-metadata', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'apikey': 'YOUR_ANON_KEY',
       'Authorization': `Bearer YOUR_ANON_KEY`
     },
     body: JSON.stringify({ url: 'https://example.com' })
   });
   ```

### How Link Metadata Extraction Works

The application extracts metadata (title, description, thumbnail, favicon) from links in two ways:

1. **Server-side extraction** using Supabase Edge Functions (recommended)
   - Works reliably on all platforms (web, Android, iOS)
   - Handles CORS restrictions
   - Provides AI-powered category suggestions

2. **Client-side fallback** using browser APIs
   - Used when the Edge Function is unavailable
   - May not work properly on all platforms (especially mobile)

The application automatically tries the server-side approach first, then falls back to client-side extraction if needed.

## License

Copyright © 2024 DunneWebSolutions. All rights reserved.
