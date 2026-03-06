import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

function getDemoResearchData(topic: string) {
  return {
    trending: [
      { name: `${topic} Trends: Complete Guide`, snippet: `Discover the latest trends in ${topic}. Comprehensive coverage of the current state and future predictions.`, url: 'https://example.com/trends', host_name: 'example.com', date: new Date().toISOString() },
      { name: `How ${topic} is Changing the Industry`, snippet: `An in-depth look at how ${topic} is revolutionizing various sectors. Expert insights and analysis.`, url: 'https://example.com/industry', host_name: 'example.com', date: new Date().toISOString() },
      { name: `Top 10 ${topic} Tips for Beginners`, snippet: `Getting started with ${topic}? Here are the top 10 tips every beginner should know.`, url: 'https://example.com/tips', host_name: 'example.com', date: new Date().toISOString() },
      { name: `${topic} News: Latest Updates`, snippet: `Stay informed with the latest news and updates about ${topic}. Breaking stories and important developments.`, url: 'https://example.com/news', host_name: 'example.com', date: new Date().toISOString() },
      { name: `The Future of ${topic}: Expert Predictions`, snippet: `Industry experts share their predictions about where ${topic} is headed in the coming years.`, url: 'https://example.com/future', host_name: 'example.com', date: new Date().toISOString() }
    ],
    ideas: [
      { name: `${topic} Tutorial Video Ideas`, snippet: `Step-by-step tutorials covering various aspects of ${topic} for different skill levels.`, url: 'https://example.com/tutorials', host_name: 'example.com', date: new Date().toISOString() },
      { name: `${topic} Documentary Concepts`, snippet: `Documentary-style content exploring the history and impact of ${topic}.`, url: 'https://example.com/documentary', host_name: 'example.com', date: new Date().toISOString() }
    ],
    topic,
    isDemo: true
  };
}

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();
    if (!topic) return NextResponse.json({ success: false, error: 'Topic is required' }, { status: 400 });

    try {
      const client = new Anthropic();

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Search for the latest trending YouTube content and news about "${topic}". Then return ONLY a JSON array (no markdown, no explanation) of the top 5 results in this format:
[{"name":"title","snippet":"description","url":"https://...","host_name":"domain.com","date":"2025-01-01T00:00:00Z"}]`
        }]
      });

      // Try to extract JSON from the final text response
      for (const block of response.content) {
        if (block.type === 'text') {
          const match = block.text.match(/\[[\s\S]*?\]/);
          if (match) {
            try {
              const parsed = JSON.parse(match[0]);
              if (Array.isArray(parsed) && parsed.length > 0) {
                return NextResponse.json({ success: true, trending: parsed, ideas: [], topic });
              }
            } catch { /* continue */ }
          }
        }
      }

      // Fallback to demo
      return NextResponse.json({ success: true, ...getDemoResearchData(topic) });

    } catch (apiError: unknown) {
      const msg = apiError instanceof Error ? apiError.message : String(apiError);
      if (msg.includes('429') || msg.includes('rate limit')) {
        return NextResponse.json({ success: true, ...getDemoResearchData(topic) });
      }
      throw apiError;
    }
  } catch (error) {
    console.error('Research error:', error);
    return NextResponse.json({ success: false, error: 'Failed to research topic' }, { status: 500 });
  }
}
