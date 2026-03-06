import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode, getChannelInfo } from '@/lib/youtube-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/?youtube_error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/?youtube_error=no_code', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Get channel info
    let channelInfo = null;
    try {
      if (tokens.access_token) {
        channelInfo = await getChannelInfo(tokens.access_token, tokens.refresh_token || undefined);
      }
    } catch (channelError) {
      console.error('Failed to get channel info:', channelError);
    }

    // In production, store tokens securely in a database
    // For demo, we'll return them in a redirect
    
    const tokenData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      channel: channelInfo ? {
        id: channelInfo.id,
        title: channelInfo.snippet?.title,
        thumbnail: channelInfo.snippet?.thumbnails?.default?.url,
        subscriberCount: channelInfo.statistics?.subscriberCount,
      } : null,
    };

    // Redirect back to the app with token data
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('youtube_connected', 'true');
    redirectUrl.searchParams.set('channel', JSON.stringify(tokenData.channel));
    
    // Store tokens in a secure HTTP-only cookie (for demo purposes)
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('youtube_tokens', JSON.stringify(tokenData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('YouTube callback error:', error);
    return NextResponse.redirect(
      new URL(`/?youtube_error=${encodeURIComponent('Authentication failed')}`, request.url)
    );
  }
}
