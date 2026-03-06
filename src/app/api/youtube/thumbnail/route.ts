import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'generated');

function generateDemoThumbnail(title: string): string {
  const truncatedTitle = title.length > 30 ? title.substring(0, 30) + '...' : title;
  const safe = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<svg width="1440" height="720" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>
  <circle cx="200" cy="150" r="100" fill="rgba(255,255,255,0.1)"/>
  <circle cx="1300" cy="600" r="150" fill="rgba(255,255,255,0.08)"/>
  <circle cx="720" cy="320" r="80" fill="rgba(255,255,255,0.9)"/>
  <polygon points="700,280 700,360 770,320" fill="#764ba2"/>
  <rect x="100" y="480" width="1240" height="160" rx="20" fill="rgba(0,0,0,0.3)"/>
  <text x="720" y="570" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">${safe(truncatedTitle)}</text>
  <rect x="50" y="50" width="200" height="50" rx="25" fill="url(#accentGradient)"/>
  <text x="150" y="85" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">DEMO MODE</text>
</svg>`;
}

export async function POST(request: NextRequest) {
  try {
    const { concept, title } = await request.json();
    if (!concept) return NextResponse.json({ success: false, error: 'Thumbnail concept is required' }, { status: 400 });

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    try {
      const client = new Anthropic();

      // Use Claude to generate an SVG thumbnail
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: `You are an expert SVG designer specializing in YouTube thumbnails. Generate complete, valid SVG code for eye-catching YouTube thumbnails. The SVG must be exactly 1440x720 pixels. Use vibrant gradients, bold typography, and professional design. Return ONLY the raw SVG code starting with <svg, no markdown, no explanation.`,
        messages: [{
          role: 'user',
          content: `Create a professional YouTube thumbnail SVG (1440x720px) for:
Title: "${title || concept}"
Concept: ${concept}

Requirements:
- Bold, readable title text prominently displayed
- Vibrant gradient background (use colors fitting the topic)
- Professional, eye-catching design
- Include decorative elements (geometric shapes, glows, etc.)
- Leave space for the title text to be clearly legible
- Modern YouTube thumbnail aesthetic

Return ONLY the SVG code, starting with <svg`
        }]
      });

      const svgContent = message.content[0].type === 'text' ? message.content[0].text.trim() : null;

      if (svgContent && svgContent.startsWith('<svg')) {
        const filename = `thumbnail_${Date.now()}.svg`;
        const filepath = path.join(OUTPUT_DIR, filename);
        fs.writeFileSync(filepath, svgContent);
        return NextResponse.json({ success: true, thumbnailUrl: `/generated/${filename}`, concept, filename });
      }

      throw new Error('Invalid SVG response from Claude');

    } catch (apiError: unknown) {
      const msg = apiError instanceof Error ? apiError.message : String(apiError);
      if (msg.includes('429') || msg.includes('rate limit') || msg.includes('overloaded')) {
        const svgContent = generateDemoThumbnail(title || concept);
        const filename = `thumbnail_demo_${Date.now()}.svg`;
        fs.writeFileSync(path.join(OUTPUT_DIR, filename), svgContent);
        return NextResponse.json({ success: true, thumbnailUrl: `/generated/${filename}`, concept, filename, isDemo: true });
      }
      throw apiError;
    }
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate thumbnail' }, { status: 500 });
  }
}
