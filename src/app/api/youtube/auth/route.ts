import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl, getYouTubeConfigStatus } from '@/lib/youtube-client';

export async function GET(request: NextRequest) {
  try {
    const configStatus = getYouTubeConfigStatus();
    
    if (!configStatus.configured) {
      return NextResponse.json({
        success: false,
        error: 'YouTube API not configured',
        config: configStatus,
        message: 'Please set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in your environment variables.',
      });
    }
    
    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({
      timestamp: Date.now(),
      redirect: request.headers.get('referer') || '/',
    })).toString('base64');
    
    const authUrl = getAuthUrl(state);
    
    return NextResponse.json({
      success: true,
      authUrl,
      config: configStatus,
    });
  } catch (error) {
    console.error('YouTube auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
