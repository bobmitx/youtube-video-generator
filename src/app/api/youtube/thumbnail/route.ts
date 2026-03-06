import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'generated');

// Generate a demo SVG thumbnail when rate limits are hit
function generateDemoThumbnail(title: string): string {
  const truncatedTitle = title.length > 30 ? title.substring(0, 30) + '...' : title;
  
  const svg = `<svg width="1440" height="720" xmlns="http://www.w3.org/2000/svg">
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
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>
  
  <!-- Decorative circles -->
  <circle cx="200" cy="150" r="100" fill="rgba(255,255,255,0.1)"/>
  <circle cx="1300" cy="600" r="150" fill="rgba(255,255,255,0.08)"/>
  <circle cx="1200" cy="100" r="80" fill="rgba(255,255,255,0.06)"/>
  
  <!-- Play button circle -->
  <circle cx="720" cy="320" r="80" fill="rgba(255,255,255,0.9)"/>
  <polygon points="700,280 700,360 770,320" fill="#764ba2"/>
  
  <!-- Title area -->
  <rect x="100" y="480" width="1240" height="160" rx="20" fill="rgba(0,0,0,0.3)"/>
  
  <!-- Title text -->
  <text x="720" y="570" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">${truncatedTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
  
  <!-- Demo badge -->
  <rect x="50" y="50" width="200" height="50" rx="25" fill="url(#accentGradient)"/>
  <text x="150" y="85" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">DEMO MODE</text>
  
  <!-- YouTube style elements -->
  <rect x="1100" y="50" width="290" height="60" rx="10" fill="rgba(255,255,255,0.2)"/>
  <text x="1245" y="90" font-family="Arial, sans-serif" font-size="28" fill="white" text-anchor="middle">▶ WATCH NOW</text>
  
  <!-- Decorative lines -->
  <line x1="100" y1="200" x2="400" y2="200" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
  <line x1="1040" y1="200" x2="1340" y2="200" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
</svg>`;
  
  return svg;
}

export async function POST(request: NextRequest) {
  try {
    const { concept, title } = await request.json();

    if (!concept) {
      return NextResponse.json(
        { success: false, error: 'Thumbnail concept is required' },
        { status: 400 }
      );
    }

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    try {
      const zai = await ZAI.create();

      // Build an enhanced prompt for YouTube thumbnail
      const enhancedPrompt = `YouTube thumbnail, ${concept}, vibrant colors, eye-catching, professional design, high contrast, bold text space, 16:9 aspect ratio, modern style, attention-grabbing, ${title ? `related to "${title}"` : ''}`;

      const response = await zai.images.generations.create({
        prompt: enhancedPrompt,
        size: '1440x720' // YouTube thumbnail aspect ratio
      });

      const imageBase64 = response.data[0].base64;
      const buffer = Buffer.from(imageBase64, 'base64');
      
      const filename = `thumbnail_${Date.now()}.png`;
      const filepath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filepath, buffer);

      return NextResponse.json({
        success: true,
        thumbnailUrl: `/generated/${filename}`,
        concept,
        filename
      });
    } catch (apiError: unknown) {
      // Check if it's a rate limit error
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        console.log('Rate limit hit for thumbnail, using demo thumbnail');
        
        // Generate demo SVG thumbnail
        const svgContent = generateDemoThumbnail(title || concept);
        const filename = `thumbnail_demo_${Date.now()}.svg`;
        const filepath = path.join(OUTPUT_DIR, filename);
        fs.writeFileSync(filepath, svgContent);

        return NextResponse.json({
          success: true,
          thumbnailUrl: `/generated/${filename}`,
          concept,
          filename,
          isDemo: true
        });
      }
      throw apiError;
    }
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate thumbnail' },
      { status: 500 }
    );
  }
}
