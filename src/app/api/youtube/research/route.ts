import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Demo data for when rate limits are hit
function getDemoResearchData(topic: string) {
  return {
    trending: [
      {
        name: `${topic} Trends in 2024: Complete Guide`,
        snippet: `Discover the latest trends and developments in ${topic}. This comprehensive guide covers everything you need to know about the current state and future predictions.`,
        url: 'https://example.com/trends',
        host_name: 'example.com',
        date: new Date().toISOString()
      },
      {
        name: `How ${topic} is Changing the Industry`,
        snippet: `An in-depth look at how ${topic} is revolutionizing various sectors. Expert insights and analysis on the impact and implications.`,
        url: 'https://example.com/industry',
        host_name: 'example.com',
        date: new Date().toISOString()
      },
      {
        name: `Top 10 ${topic} Tips for Beginners`,
        snippet: `Getting started with ${topic}? Here are the top 10 tips every beginner should know to get up to speed quickly.`,
        url: 'https://example.com/tips',
        host_name: 'example.com',
        date: new Date().toISOString()
      },
      {
        name: `${topic} News: Latest Updates`,
        snippet: `Stay informed with the latest news and updates about ${topic}. Breaking stories and important developments.`,
        url: 'https://example.com/news',
        host_name: 'example.com',
        date: new Date().toISOString()
      },
      {
        name: `The Future of ${topic}: Expert Predictions`,
        snippet: `Industry experts share their predictions about where ${topic} is headed in the coming years.`,
        url: 'https://example.com/future',
        host_name: 'example.com',
        date: new Date().toISOString()
      }
    ],
    ideas: [
      {
        name: `${topic} Tutorial Video Ideas`,
        snippet: `Step-by-step tutorials covering various aspects of ${topic} for different skill levels.`,
        url: 'https://example.com/tutorials',
        host_name: 'example.com',
        date: new Date().toISOString()
      },
      {
        name: `${topic} Documentary Concepts`,
        snippet: `Documentary-style content exploring the history and impact of ${topic}.`,
        url: 'https://example.com/documentary',
        host_name: 'example.com',
        date: new Date().toISOString()
      }
    ],
    topic,
    isDemo: true
  };
}

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      );
    }

    try {
      const zai = await ZAI.create();

      // Search for trending topics related to the input
      const searchResults = await zai.functions.invoke('web_search', {
        query: `${topic} YouTube trending 2024`,
        num: 5,
        recency_days: 7
      });

      return NextResponse.json({
        success: true,
        trending: searchResults,
        ideas: [],
        topic
      });
    } catch (apiError: unknown) {
      // Check if it's a rate limit error
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        console.log('Rate limit hit, using demo data');
        return NextResponse.json({
          success: true,
          ...getDemoResearchData(topic)
        });
      }
      throw apiError;
    }
  } catch (error) {
    console.error('Research error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to research topic' },
      { status: 500 }
    );
  }
}
