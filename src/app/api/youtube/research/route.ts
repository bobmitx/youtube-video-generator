import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { createHash } from 'crypto';

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
    ],
    topic,
    isDemo: true
  };
}

export async function POST(request: NextRequest) {
  try {
    const { topic, workflowId } = await request.json();
    if (!topic) return NextResponse.json({ success: false, error: 'Topic is required' }, { status: 400 });

    // Check cache (24hr TTL)
    const topicHash = createHash('md5').update(topic.toLowerCase().trim()).digest('hex');
    const cached = await db.researchCache.findUnique({ where: { topicHash } }).catch(() => null);
    if (cached && cached.expiresAt > new Date()) {
      const data = cached.data as Record<string, unknown>;
      if (workflowId) {
        await db.workflow.update({
          where: { id: workflowId },
          data: { researchData: data, updatedAt: new Date() },
        }).catch(() => {});
      }
      return NextResponse.json({ success: true, ...data, cached: true });
    }

    let resultData: ReturnType<typeof getDemoResearchData>;

    try {
      const client = new Anthropic();
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
        messages: [{
          role: 'user',
          content: `Search for the latest trending YouTube content and news about "${topic}". Then return ONLY a JSON array (no markdown, no explanation) of the top 5 results in this format:
[{"name":"title","snippet":"description","url":"https://...","host_name":"domain.com","date":"2025-01-01T00:00:00Z"}]`
        }]
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parsed: any[] | null = null;
      for (const block of response.content) {
        if (block.type === 'text') {
          const match = block.text.match(/\[[\s\S]*?\]/);
          if (match) {
            try {
              const arr = JSON.parse(match[0]);
              if (Array.isArray(arr) && arr.length > 0) { parsed = arr; break; }
            } catch { /* continue */ }
          }
        }
      }

      resultData = parsed
        ? { trending: parsed, ideas: [], topic, isDemo: false }
        : getDemoResearchData(topic);

    } catch (apiError: unknown) {
      const msg = apiError instanceof Error ? apiError.message : String(apiError);
      if (msg.includes('429') || msg.includes('rate limit')) {
        resultData = getDemoResearchData(topic);
      } else {
        throw apiError;
      }
    }

    // Cache result
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.researchCache.upsert({
      where: { topicHash },
      create: { topicHash, topic, data: resultData, expiresAt },
      update: { data: resultData, expiresAt },
    }).catch(() => {});

    // Persist to workflow
    if (workflowId) {
      await db.workflow.update({
        where: { id: workflowId },
        data: { researchData: resultData, updatedAt: new Date() },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, ...resultData });
  } catch (error) {
    console.error('Research error:', error);
    return NextResponse.json({ success: false, error: 'Failed to research topic' }, { status: 500 });
  }
}
