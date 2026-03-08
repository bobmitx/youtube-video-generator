import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { db } from '@/lib/db';

const FAL_MODEL = 'fal-ai/pika/v2.2/text-to-video';

function getFalClient() {
  fal.config({ credentials: process.env.FAL_KEY });
  return fal;
}

export async function POST(request: NextRequest) {
  try {
    const { sceneDescription, workflowId, resolution = '720p', duration = 5 } = await request.json();
    if (!sceneDescription) {
      return NextResponse.json({ success: false, error: 'Scene description is required' }, { status: 400 });
    }

    if (!process.env.FAL_KEY) {
      return NextResponse.json({
        success: true,
        taskId: 'demo-video-task',
        status: 'PROCESSING',
        isDemo: true,
        workflowId,
        message: 'Add FAL_KEY environment variable to enable real Pika v2.2 video generation.',
      });
    }

    const client = getFalClient();
    const { request_id } = await client.queue.submit(FAL_MODEL, {
      input: { prompt: sceneDescription, resolution, duration },
    });

    return NextResponse.json({
      success: true,
      taskId: request_id,
      status: 'PROCESSING',
      isDemo: false,
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

    if (taskId === 'demo-video-task' || !process.env.FAL_KEY) {
      return NextResponse.json({
        success: true, taskId, status: 'SUCCESS',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        isDemo: true,
      });
    }

    const client = getFalClient();
    const statusResult = await client.queue.status(FAL_MODEL, { requestId: taskId, logs: false });

    if (statusResult.status === 'COMPLETED') {
      const result = await client.queue.result(FAL_MODEL, { requestId: taskId });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const videoUrl = (result.data as any)?.video?.url as string | undefined;

      if (workflowId && videoUrl) {
        await db.workflow.update({
          where: { id: workflowId },
          data: { videoUrl, status: 'completed', updatedAt: new Date() },
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, taskId, status: 'SUCCESS', videoUrl, isDemo: false });
    }

    return NextResponse.json({ success: true, taskId, status: 'PROCESSING', isDemo: false });
  } catch (error) {
    console.error('Video status check error:', error);
    return NextResponse.json({ success: false, error: 'Failed to check video status' }, { status: 500 });
  }
}
