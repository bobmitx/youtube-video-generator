# YouTube API Setup Guide

This guide will help you configure real YouTube publishing for the Video Storyline Generator.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com)

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name (e.g., "YouTube Video Generator")
4. Click **"Create"**

### 2. Enable YouTube Data API

1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for **"YouTube Data API v3"**
3. Click on it and press **"Enable"**

### 3. Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** user type (unless you have a Google Workspace account)
3. Fill in the required fields:
   - **App name**: YouTube Video Generator
   - **User support email**: Your email
   - **App logo**: (optional)
   - **Developer contact email**: Your email
4. Click **"Save and Continue"**
5. On **Scopes** page, click **"Add or Remove Scopes"**
6. Search for and enable:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube`
7. Click **"Save and Continue"**
8. Add test users (your email) if in testing mode
9. Click **"Save and Continue"** → **"Back to Dashboard"**

### 4. Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: **"YouTube Video Generator"**
5. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - (Add your production domain when deploying)
6. **Authorized redirect URIs**:
   - `http://localhost:3000/api/youtube/callback`
   - (Add your production callback URL when deploying)
7. Click **"Create"**
8. **IMPORTANT**: Copy the **Client ID** and **Client Secret**

### 5. Configure Environment Variables

Create or update your `.env` file:

```env
# YouTube API Configuration
YOUTUBE_CLIENT_ID=your-client-id-here
YOUTUBE_CLIENT_SECRET=your-client-secret-here
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback
```

### 6. Restart the Development Server

```bash
# Stop the current server (Ctrl+C)
# Restart with:
bun run dev
```

## Testing the Integration

1. Go to the application in your browser
2. Complete the video creation workflow (Steps 1-4)
3. On Step 5, click **"Connect YouTube Account"**
4. A popup will open asking you to sign in to Google
5. Authorize the application
6. Your channel info will appear
7. Click **"Publish to YouTube"**
8. Your video will be uploaded to YouTube!

## Production Deployment

When deploying to production:

1. Add your production domain to **Authorized JavaScript origins**:
   - `https://your-domain.com`

2. Add your production callback URL to **Authorized redirect URIs**:
   - `https://your-domain.com/api/youtube/callback`

3. Update environment variables:
   ```env
   YOUTUBE_REDIRECT_URI=https://your-domain.com/api/youtube/callback
   ```

4. If your app is in "Testing" mode, you need to add users manually.
   To allow anyone to use it, publish your app:
   - Go to OAuth consent screen
   - Click **"Publish App"**

## Troubleshooting

### "Access blocked: App is waiting for verification"
- Your app is in testing mode
- Add your email as a test user in OAuth consent screen

### "Redirect URI mismatch"
- Make sure the redirect URI in your `.env` matches exactly what's in Google Cloud Console
- Check for trailing slashes

### "Invalid client"
- Double-check your Client ID and Client Secret
- Make sure there are no extra spaces in your `.env` file

### "Insufficient permissions"
- Make sure you've enabled both YouTube scopes in the OAuth consent screen

## Video Upload Limitations

- Videos are uploaded as **Private** by default
- Maximum file size: 256 GB (for verified accounts)
- Supported formats: MP4, MOV, AVI, WMV, etc.

## Security Notes

- **Never** commit your `.env` file to version control
- Use environment variables in your hosting platform (Vercel, etc.)
- The OAuth tokens are stored in HTTP-only cookies for security
- Tokens expire and need to be refreshed automatically

## Need Help?

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
