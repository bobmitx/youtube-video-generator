import { NextRequest, NextResponse } from 'next/server';
import { uploadVideo, setThumbnail, isYouTubeConfigured } from '@/lib/youtube-client';

export async function POST(request: NextRequest) {
  try {
    // Check if YouTube is configured
    if (!isYouTubeConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'YouTube API not configured',
        demo: true,
        message: 'To enable YouTube publishing, configure WETRAUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET',
      });
    }

    // Get tokens from cookie
    const tokensCookie = request.cookies.get('youtube_tokens');
    
    if (!tokensCookie) {
      return NextResponse.json({
        success: false,
        error: 'Not connected to YouTube',
        requiresAuth: true,
      });
    }

    const tokens = JSON.parse(tokensCookie.value);

    // Check if token is expired
    if (tokens.expiryDate && Date.now() > tokens.expiryDate) {
      return NextResponse.json({
        success: false,
        error: 'YouTube token expired',
        requiresAuth: true,
      });
    }

    const body = await request.json();
    const { title, description, tags, videoUrl, thumbnailUrl, privacyStatus } = body;

    if (!title || !videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Title and video URL are required' },
        { status: 400 }
      );
    }

    // Upload video to YouTube
    const videoResult = await uploadVideo(
      tokens.accessToken,
      tokens.refreshToken,
      {
        title,
        description: description || '',
        tags: tags || [],
        videoUrl,
        thumbnailUrl,
        privacyStatus: privacyStatus || 'private',
      }
    );

    // Set thumbnail if provided
    if (thumbnailUrl && videoResult.id) {
      try {
        await setThumbnail(
          tokens.accessToken,
          tokens.refreshToken,
          videoResult.id,
          thumbnailUrl
        );
      } catch (thumbError) {
        console.error('Failed to set thumbnail:', thumbError);
        // Don't fail the whole upload for thumbnail error
      }
    }

    return NextResponse.json({
      success: true,
      video: videoResult,
      message: 'Video published successfully!',
    });
  } catch (error) {
    console.error('YouTube publish error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to publish video' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if YouTube is configured
    if (!isYouTubeConfigured()) {
      return NextResponse.json({
        connected: false,
        configured: false,
        message: 'YouTube API not configured. Add credentials to enable publishing.',
      });
    }

    // Get tokens from cookie
    const tokensCookie = request.cookies.get('youtube_tokens');
    
    if (!tokensCookie) {
      return NextResponse.json({
        connected: false,
        configured: true,
        message: 'Connect to YouTube to publish videos',
      });
    }

    const tokens = JSON.parse(tokensCookie.value);

    // Check if token is expired
    const isExpired = tokens.expiryDate && Date.now() > tokens.expiryDate;

    return NextResponse.json({
      connected: !isExpired,
      configured: true,
      channel: tokens.channel,
      isExpired,
    });
  } catch (error) {
    console.error('YouTube status check error:', error);
    return NextResponse.json(
      { connected: false, error: 'Failed to check YouTube status' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  // Disconnect from YouTube
  const response = NextResponse.json({
    success: true,
    message: 'Disconnected from YouTube',
  });
  
  response.cookies.delete('youtube_tokens');
  return response;
}
