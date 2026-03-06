import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const workflow = await db.workflow.findUnique({ where: { id } });
    if (!workflow) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, workflow });
  } catch (error) {
    console.error('Workflow get error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get workflow' }, { status: 500 });
  }
}
