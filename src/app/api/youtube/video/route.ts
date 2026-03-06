import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEMO_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';

export async function POST(request: NextRequest) {
  try {
    const { sceneDescription, workflowId } = await request.json();
    if (!sceneDescription) {
      return NextResponse.json({ success: false, error: 'Scene description is required' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      taskId: 'demo-video-task',
      status: 'PROCESSING',
      isDemo: true,
      message: 'Demo mode: Integrate Runway ML or Kling AI for real video generation.',
      workflowId,
    });
  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create video generation task' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const workflowId = searchParams.get('workflowId');
    if (!taskId) return NextResponse.json({ success: false, error: 'Task ID is required' }, { status: 400 });

    // Persist video URL to workflow on completion
    if (workflowId) {
      await db.workflow.update({
        where: { id: workflowId },
        data: { videoUrl: DEMO_VIDEO_URL, status: 'completed', updatedAt: new Date() },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      taskId,
      status: 'SUCCESS',
      videoUrl: DEMO_VIDEO_URL,
      isDemo: true,
    });
  } catch (error) {
    console.error('Video status check error:', error);
    return NextResponse.json({ success: false, error: 'Failed to check video status' }, { status: 500 });
  }
}
