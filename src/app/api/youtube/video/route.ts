import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Demo video URL (a sample video for demonstration)
const DEMO_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';

export async function POST(request: NextRequest) {
  try {
    const { sceneDescription, quality } = await request.json();

    if (!sceneDescription) {
      return NextResponse.json(
        { success: false, error: 'Scene description is required' },
        { status: 400 }
      );
    }

    try {
      const zai = await ZAI.create();

      // Create video generation task
      const task = await zai.video.generations.create({
        prompt: sceneDescription,
        quality: quality || 'speed',
        duration: 5,
        fps: 30,
        size: '1920x1080'
      });

      return NextResponse.json({
        success: true,
        taskId: task.id,
        status: task.task_status,
        message: 'Video generation task created. Poll for status updates.'
      });
    } catch (apiError: unknown) {
      // Check if it's a rate limit error
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        console.log('Rate limit hit for video, using demo video');
        
        // Return a demo task ID that we can identify
        return NextResponse.json({
          success: true,
          taskId: 'demo-video-task',
          status: 'PROCESSING',
          isDemo: true,
          message: 'Demo mode: Video generation simulated'
        });
      }
      throw apiError;
    }
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
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Handle demo video task
    if (taskId === 'demo-video-task') {
      return NextResponse.json({
        success: true,
        taskId,
        status: 'SUCCESS',
        videoUrl: DEMO_VIDEO_URL,
        isDemo: true
      });
    }

    const zai = await ZAI.create();
    const result = await zai.async.result.query(taskId);

    let videoUrl = null;
    if (result.task_status === 'SUCCESS') {
      videoUrl = result.video_result?.[0]?.url ||
                 result.video_url ||
                 result.url ||
                 result.video;
    }

    return NextResponse.json({
      success: true,
      taskId,
      status: result.task_status,
      videoUrl
    });
  } catch (error) {
    console.error('Video status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check video status' },
      { status: 500 }
    );
  }
}
