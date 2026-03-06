import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - list recent workflows
export async function GET() {
  try {
    const workflows = await db.workflow.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        topic: true,
        format: true,
        duration: true,
        status: true,
        thumbnailUrl: true,
        videoUrl: true,
        publishedUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ success: true, workflows });
  } catch (error) {
    console.error('Workflow list error:', error);
    return NextResponse.json({ success: false, error: 'Failed to list workflows' }, { status: 500 });
  }
}

// POST - create a new workflow
export async function POST(request: NextRequest) {
  try {
    const { topic, format, duration } = await request.json();
    if (!topic) return NextResponse.json({ success: false, error: 'Topic is required' }, { status: 400 });

    const workflow = await db.workflow.create({
      data: {
        topic,
        format: format || 'documentary',
        duration: duration || '5-10 minutes',
        status: 'in_progress',
      },
    });

    return NextResponse.json({ success: true, workflow });
  } catch (error) {
    console.error('Workflow create error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create workflow' }, { status: 500 });
  }
}

// PATCH - update workflow state
export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Workflow ID required' }, { status: 400 });

    const workflow = await db.workflow.update({
      where: { id },
      data: { ...updates, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, workflow });
  } catch (error) {
    console.error('Workflow update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update workflow' }, { status: 500 });
  }
}

// DELETE - delete a workflow
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Workflow ID required' }, { status: 400 });

    await db.workflow.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Workflow delete error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete workflow' }, { status: 500 });
  }
}
