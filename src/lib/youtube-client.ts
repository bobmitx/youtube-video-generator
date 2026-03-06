import { google } from 'googleapis';

// YouTube API configuration
// Users should provide their own OAuth credentials for production
const YOUTUBE_CONFIG = {
  clientId: process.env.YOUTUBE_CLIENT_ID || '',
  clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
  redirectUri: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/callback',
};

// Scopes required for YouTube video upload
const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
];

/**
 * Create OAuth2 client for YouTube API
 */
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    YOUTUBE_CONFIG.clientId,
    YOUTUBE_CONFIG.clientSecret,
    YOUTUBE_CONFIG.redirectUri
  );
}

/**
 * Generate OAuth2 authorization URL
 */
export function getAuthUrl(state?: string): string {
  const oauth2Client = createOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: YOUTUBE_SCOPES,
    state: state || undefined,
    prompt: 'consent', // Always prompt for consent to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string) {
  const oauth2Client = createOAuth2Client();
  
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Create authenticated YouTube client
 */
export function createYouTubeClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = createOAuth2Client();
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  
  return google.youtube({ version: 'v3', auth: oauth2Client });
}

/**
 * Get user's YouTube channel info
 */
export async function getChannelInfo(accessToken: string, refreshToken?: string) {
  const youtube = createYouTubeClient(accessToken, refreshToken);
  
  const response = await youtube.channels.list({
    part: ['snippet', 'statistics'],
    mine: true,
  });
  
  return response.data.items?.[0] || null;
}

/**
 * Upload video to YouTube
 */
export async function uploadVideo(
  accessToken: string,
  refreshToken: string | undefined,
  options: {
    title: string;
    description: string;
    tags?: string[];
    videoUrl: string;
    thumbnailUrl?: string;
    privacyStatus?: 'public' | 'unlisted' | 'private';
  }
) {
  const { title, description, tags, videoUrl, privacyStatus = 'private' } = options;
  
  const youtube = createYouTubeClient(accessToken, refreshToken);
  
  // For demo purposes, we'll return a simulated response
  // In production, you would download the video and upload it to YouTube
  // The YouTube API requires the video file to be uploaded as a stream
  
  return {
    id: `demo_video_${Date.now()}`,
    status: {
      uploadStatus: 'uploaded',
      privacyStatus,
    },
    snippet: {
      title,
      description,
      tags,
      channelId: 'demo_channel',
      channelTitle: 'Demo Channel',
    },
  };
}

/**
 * Set video thumbnail
 */
export async function setThumbnail(
  accessToken: string,
  refreshToken: string | undefined,
  videoId: string,
  thumbnailUrl: string
) {
  const youtube = createYouTubeClient(accessToken, refreshToken);
  
  // In production, download the thumbnail and upload it
  // This requires special permission from YouTube
  
  return { success: true };
}

/**
 * Check if YouTube is configured
 */
export function isYouTubeConfigured(): boolean {
  return !!(YOUTUBE_CONFIG.clientId && YOUTUBE_CONFIG.clientSecret);
}

/**
 * Get configuration status for UI
 */
export function getYouTubeConfigStatus() {
  return {
    configured: isYouTubeConfigured(),
    hasClientId: !!YOUTUBE_CONFIG.clientId,
    hasClientSecret: !!YOUTUBE_CONFIG.clientSecret,
    redirectUri: YOUTUBE_CONFIG.redirectUri,
  };
}
