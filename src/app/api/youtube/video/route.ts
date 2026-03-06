import { NextRequest, NextResponse } from 'next/server';

// Video generation is not available in the Anthropic API.
// This route maintains the demo mode behavior from the original.
// To enable real video generation, integrate a third-party service
// such as Runway ML, Kling AI, or Pika Labs.

const DEMO_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';

export async function POST(request: NextRequest) {
  try {
    const { sceneDescription } = await request.json();

    if (!sceneDescription) {
      return NextResponse.json(
        { success: false, error: 'Scene description is required' },
        { status: 400 }
      );
    }

    // Demo mode - return a mock task ID
    return NextResponse.json({
      success: true,
      taskId: 'demo-video-task',
      status: 'PROCESSING',
      isDemo: true,
      message: 'Demo mode: Video generation simulated. Integrate Runway ML or Kling AI for real video generation.'
    });

  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create video generation task' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ success: false, error: 'Task ID is required' }, { status: 400 });
    }

    // All tasks return demo video
    return NextResponse.json({
      success: true,
      taskId,
      status: 'SUCCESS',
      videoUrl: DEMO_VIDEO_URL,
      isDemo: true
    });

  } catch (error) {
    console.error('Video status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check video status' },
      { status: 500 }
    );
  }
}
