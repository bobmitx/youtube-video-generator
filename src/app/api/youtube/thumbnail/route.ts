import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getStore } from '@netlify/blobs';
import { db } from '@/lib/db';

function generateDemoThumbnail(title: string): string {
  const truncatedTitle = title.length > 30 ? title.substring(0, 30) + '...' : title;
  const safe = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<svg width="1440" height="720" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="200" cy="150" r="100" fill="rgba(255,255,255,0.1)"/>
  <circle cx="1300" cy="600" r="150" fill="rgba(255,255,255,0.08)"/>
  <circle cx="720" cy="320" r="80" fill="rgba(255,255,255,0.9)"/>
  <polygon points="700,280 700,360 770,320" fill="#764ba2"/>
  <rect x="100" y="480" width="1240" height="160" rx="20" fill="rgba(0,0,0,0.3)"/>
  <text x="720" y="570" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">${safe(truncatedTitle)}</text>
  <rect x="50" y="50" width="200" height="50" rx="25" fill="url(#accent)"/>
  <text x="150" y="85" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">DEMO</text>
</svg>`;
}

export async function POST(request: NextRequest) {
  try {
    const { concept, title, workflowId } = await request.json();
    if (!concept) return NextResponse.json({ success: false, error: 'Thumbnail concept is required' }, { status: 400 });

    let svgContent: string;
    let isDemo = false;

    try {
      const client = new Anthropic();
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: `You are an expert SVG designer specializing in YouTube thumbnails. Generate complete, valid SVG code for eye-catching YouTube thumbnails. The SVG must be exactly 1440x720 pixels. Use vibrant gradients, bold typography, and professional design. Return ONLY the raw SVG code starting with <svg, no markdown, no explanation.`,
        messages: [{
          role: 'user',
          content: `Create a professional YouTube thumbnail SVG (1440x720px) for:\nTitle: "${title || concept}"\nConcept: ${concept}\n\nReturn ONLY the SVG code, starting with <svg`
        }]
      });

      const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : null;
      if (raw && raw.startsWith('<svg')) {
        svgContent = raw;
      } else {
        throw new Error('Invalid SVG response');
      }
    } catch (apiError: unknown) {
      const msg = apiError instanceof Error ? apiError.message : String(apiError);
      if (msg.includes('429') || msg.includes('rate limit') || msg.includes('overloaded') || msg.includes('Invalid SVG')) {
        svgContent = generateDemoThumbnail(title || concept);
        isDemo = true;
      } else {
        throw apiError;
      }
    }

    // Store in Netlify Blobs (works on Netlify, no filesystem dependency)
    const key = `thumbnail_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.svg`;
    const store = getStore('thumbnails');
    await store.set(key, svgContent, {
      metadata: { title: title || concept, concept, isDemo, createdAt: new Date().toISOString() }
    });

    const thumbnailUrl = `/api/youtube/thumbnail/serve?key=${encodeURIComponent(key)}`;

    // Persist to workflow in DB if workflowId provided
    if (workflowId) {
      await db.workflow.update({
        where: { id: workflowId },
        data: { thumbnailKey: key, thumbnailUrl, updatedAt: new Date() },
      }).catch(() => { /* non-fatal */ });
    }

    return NextResponse.json({ success: true, thumbnailUrl, key, concept, isDemo });
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate thumbnail' }, { status: 500 });
  }
}
