'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  ArrowRight, 
  CheckCircle2, 
  Circle, 
  Loader2,
  Sparkles,
  Youtube,
  ExternalLink,
  RefreshCw,
  Copy,
  Download,
  Info,
  Zap,
  Shield,
  Users,
  Clock,
  Upload,
  Link2,
  Unlink
} from 'lucide-react';

interface ResearchResult {
  name: string;
  snippet: string;
  url: string;
  host_name: string;
  date: string;
}

interface YouTubeChannel {
  id: string;
  title: string;
  thumbnail: string;
  subscriberCount: string;
}

interface WorkflowState {
  currentStep: number;
  topic: string;
  format: string;
  duration: string;
  researchData: {
    trending: ResearchResult[];
    ideas: ResearchResult[];
    topic: string;
    isDemo?: boolean;
  } | null;
  storyline: string | null;
  storylineIsDemo: boolean;
  thumbnailUrl: string | null;
  thumbnailIsDemo: boolean;
  videoTaskId: string | null;
  videoIsDemo: boolean;
  videoStatus: string;
  videoUrl: string | null;
  // YouTube Publishing
  youtubeConnected: boolean;
  youtubeConfigured: boolean;
  youtubeChannel: YouTubeChannel | null;
  youtubePublishing: boolean;
  youtubePublishResult: {
    success: boolean;
    videoId?: string;
    videoUrl?: string;
    message?: string;
  } | null;
  loading: {
    research: boolean;
    storyline: boolean;
    thumbnail: boolean;
    video: boolean;
    youtube: boolean;
  };
  error: string | null;
}

const steps = [
  { id: 1, title: 'Topic Research', description: 'Research trending topics', icon: Search },
  { id: 2, title: 'Storyline Generation', description: 'Create video script', icon: FileText },
  { id: 3, title: 'Thumbnail Creation', description: 'Generate eye-catching thumbnail', icon: ImageIcon },
  { id: 4, title: 'Video Generation', description: 'Create video clips', icon: Video },
  { id: 5, title: 'Publish to YouTube', description: 'Upload to your channel', icon: Youtube },
];

export default function YouTubeWorkflowApp() {
  const [state, setState] = useState<WorkflowState>({
    currentStep: 0,
    topic: '',
    format: 'documentary',
    duration: '5-10 minutes',
    researchData: null,
    storyline: null,
    storylineIsDemo: false,
    thumbnailUrl: null,
    thumbnailIsDemo: false,
    videoTaskId: null,
    videoIsDemo: false,
    videoStatus: '',
    videoUrl: null,
    // YouTube Publishing
    youtubeConnected: false,
    youtubeConfigured: false,
    youtubeChannel: null,
    youtubePublishing: false,
    youtubePublishResult: null,
    loading: {
      research: false,
      storyline: false,
      thumbnail: false,
      video: false,
      youtube: false,
    },
    error: null,
  });

  const updateState = useCallback((updates: Partial<WorkflowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Step 1: Research Topic
  const handleResearch = async () => {
    if (!state.topic.trim()) return;

    updateState({ 
      loading: { ...state.loading, research: true },
      error: null 
    });

    try {
      const response = await fetch('/api/youtube/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: state.topic }),
      });

      const data = await response.json();

      if (data.success) {
        updateState({ 
          researchData: data,
          currentStep: 1,
          loading: { ...state.loading, research: false }
        });
      } else {
        updateState({ 
          error: data.error,
          loading: { ...state.loading, research: false }
        });
      }
    } catch (error) {
      updateState({ 
        error: 'Failed to research topic',
        loading: { ...state.loading, research: false }
      });
    }
  };

  // Step 2: Generate Storyline
  const handleGenerateStoryline = async () => {
    updateState({ 
      loading: { ...state.loading, storyline: true },
      error: null 
    });

    try {
      const response = await fetch('/api/youtube/storyline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: state.topic,
          format: state.format,
          duration: state.duration,
          researchData: state.researchData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        updateState({ 
          storyline: data.storyline,
          storylineIsDemo: data.isDemo || false,
          currentStep: 2,
          loading: { ...state.loading, storyline: false }
        });
      } else {
        updateState({ 
          error: data.error,
          loading: { ...state.loading, storyline: false }
        });
      }
    } catch (error) {
      updateState({ 
        error: 'Failed to generate storyline',
        loading: { ...state.loading, storyline: false }
      });
    }
  };

  // Step 3: Generate Thumbnail
  const handleGenerateThumbnail = async (concept?: string) => {
    const thumbnailConcept = concept || extractThumbnailConcept();
    
    updateState({ 
      loading: { ...state.loading, thumbnail: true },
      error: null 
    });

    try {
      const response = await fetch('/api/youtube/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: thumbnailConcept,
          title: state.topic,
        }),
      });

      const data = await response.json();

      if (data.success) {
        updateState({ 
          thumbnailUrl: data.thumbnailUrl,
          thumbnailIsDemo: data.isDemo || false,
          currentStep: 3,
          loading: { ...state.loading, thumbnail: false }
        });
      } else {
        updateState({ 
          error: data.error,
          loading: { ...state.loading, thumbnail: false }
        });
      }
    } catch (error) {
      updateState({ 
        error: 'Failed to generate thumbnail',
        loading: { ...state.loading, thumbnail: false }
      });
    }
  };

  // Step 4: Generate Video
  const handleGenerateVideo = async () => {
    const sceneDescription = extractSceneDescription();
    
    updateState({ 
      loading: { ...state.loading, video: true },
      error: null 
    });

    try {
      const response = await fetch('/api/youtube/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneDescription,
          quality: 'speed',
        }),
      });

      const data = await response.json();

      if (data.success) {
        updateState({ 
          videoTaskId: data.taskId,
          videoStatus: data.status,
          videoIsDemo: data.isDemo || false,
        });
        
        // Start polling for video status
        pollVideoStatus(data.taskId);
      } else {
        updateState({ 
          error: data.error,
          loading: { ...state.loading, video: false }
        });
      }
    } catch (error) {
      updateState({ 
        error: 'Failed to create video task',
        loading: { ...state.loading, video: false }
      });
    }
  };

  // Poll video status
  const pollVideoStatus = async (taskId: string) => {
    const maxPolls = 60;
    let pollCount = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/youtube/video?taskId=${taskId}`);
        const data = await response.json();

        if (data.success) {
          updateState({ videoStatus: data.status });

          if (data.status === 'SUCCESS') {
            updateState({ 
              videoUrl: data.videoUrl,
              currentStep: 4,
              loading: { ...state.loading, video: false }
            });
            return;
          }

          if (data.status === 'FAIL') {
            updateState({ 
              error: 'Video generation failed',
              loading: { ...state.loading, video: false }
            });
            return;
          }
        }

        pollCount++;
        if (pollCount < maxPolls) {
          setTimeout(poll, 5000);
        } else {
          updateState({ 
            error: 'Video generation timeout',
            loading: { ...state.loading, video: false }
          });
        }
      } catch (error) {
        updateState({ 
          error: 'Failed to check video status',
          loading: { ...state.loading, video: false }
        });
      }
    };

    poll();
  };

  // Helper functions
  const extractThumbnailConcept = () => {
    if (!state.storyline) return 'YouTube video thumbnail, professional design';
    
    const thumbnailMatch = state.storyline.match(/\*\*Thumbnail Concept\*\*[^\n]*\n([^#\n]*)/i);
    return thumbnailMatch ? thumbnailMatch[1].trim() : 'YouTube video thumbnail, professional design';
  };

  const extractSceneDescription = () => {
    if (!state.storyline) return 'A professional video scene';
    
    const hookMatch = state.storyline.match(/\*\*Hook[^*]*\*\*[^\n]*\n([^#\n]*)/i);
    return hookMatch ? hookMatch[1].trim() : `A video about ${state.topic}`;
  };

  const extractTitle = () => {
    if (!state.storyline) return state.topic;
    
    const titleMatch = state.storyline.match(/\*\*Video Title\*\*[^\n]*\n([^#\n]*)/i);
    return titleMatch ? titleMatch[1].trim() : state.topic;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Step 5: YouTube Publishing
  const checkYouTubeStatus = async () => {
    try {
      const response = await fetch('/api/youtube/publish');
      const data = await response.json();
      
      updateState({
        youtubeConnected: data.connected,
        youtubeConfigured: data.configured,
        youtubeChannel: data.channel,
      });
    } catch (error) {
      updateState({
        youtubeConnected: false,
        youtubeConfigured: false,
        youtubeChannel: null,
      });
    }
  };

  const connectYouTube = async () => {
    try {
      const response = await fetch('/api/youtube/auth');
      const data = await response.json();
      
      if (data.success && data.authUrl) {
        window.open(data.authUrl, 'youtube-auth', 'width=600,height=800');
      } else {
        // YouTube not configured - update state to show demo option
        updateState({ 
          youtubeConfigured: false,
          error: null,
        });
      }
    } catch (error) {
      updateState({ error: 'Failed to connect to YouTube' });
    }
  };

  // Connect in demo mode (when YouTube API not configured)
  const connectDemoMode = () => {
    updateState({
      youtubeConnected: true,
      youtubeConfigured: false,
      youtubeChannel: {
        id: 'demo-channel',
        title: 'Demo Channel',
        thumbnail: 'https://via.placeholder.com/40',
        subscriberCount: '1.2M',
      },
    });
  };

  const disconnectYouTube = async () => {
    try {
      await fetch('/api/youtube/publish', { method: 'DELETE' });
      updateState({
        youtubeConnected: false,
        youtubeChannel: null,
        youtubePublishResult: null,
      });
    } catch (error) {
      updateState({ error: 'Failed to disconnect from YouTube' });
    }
  };

  const publishToYouTube = async () => {
    if (!state.videoUrl) {
      updateState({ error: 'No video to publish' });
      return;
    }

    updateState({
      loading: { ...state.loading, youtube: true },
      error: null,
    });

    try {
      // If in demo mode, simulate publishing
      if (!state.youtubeConfigured && state.youtubeConnected) {
        // Demo mode - simulate successful publish
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
        updateState({
          youtubePublishResult: {
            success: true,
            videoId: `demo_${Date.now()}`,
            videoUrl: `https://youtube.com/watch?v=demo_${Date.now()}`,
            message: 'Demo mode: Video publishing simulated! Configure YouTube API for real publishing.',
          },
          currentStep: 5,
          loading: { ...state.loading, youtube: false },
        });
        return;
      }

      const title = extractTitle();
      const description = state.storyline?.split('\n').slice(0, 5).join('\n') || `Video about ${state.topic}`;
      const tags = [state.topic, 'AI Generated', 'YouTube'];

      const response = await fetch('/api/youtube/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          tags,
          videoUrl: state.videoUrl,
          thumbnailUrl: state.thumbnailUrl,
          privacyStatus: 'private',
        }),
      });

      const data = await response.json();

      if (data.success) {
        updateState({
          youtubePublishResult: {
            success: true,
            videoId: data.video?.id,
            videoUrl: `https://www.youtube.com/watch?v=${data.video?.id}`,
            message: 'Video published successfully!',
          },
          currentStep: 5,
          loading: { ...state.loading, youtube: false },
        });
      } else if (data.demo) {
        // API returned demo mode - simulate success
        updateState({
          youtubePublishResult: {
            success: true,
            videoId: `demo_${Date.now()}`,
            videoUrl: 'https://youtube.com/demo-video',
            message: 'Demo mode: Video publishing simulated. Configure YouTube API for real publishing.',
          },
          currentStep: 5,
          loading: { ...state.loading, youtube: false },
        });
      } else if (data.requiresAuth) {
        updateState({
          error: 'Please connect to YouTube first',
          youtubeConnected: false,
          loading: { ...state.loading, youtube: false },
        });
      } else {
        updateState({
          error: data.error || 'Failed to publish video',
          loading: { ...state.loading, youtube: false },
        });
      }
    } catch (error) {
      updateState({
        error: 'Failed to publish to YouTube',
        loading: { ...state.loading, youtube: false },
      });
    }
  };

  // Check YouTube connection on OAuth callback
  const handleOAuthCallback = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const youtubeConnected = urlParams.get('youtube_connected');
    const channelData = urlParams.get('channel');
    const youtubeError = urlParams.get('youtube_error');

    if (youtubeError) {
      updateState({ error: `YouTube connection failed: ${youtubeError}` });
    }

    if (youtubeConnected === 'true' && channelData) {
      try {
        const channel = JSON.parse(channelData);
        updateState({
          youtubeConnected: true,
          youtubeChannel: channel,
        });
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      } catch (e) {
        console.error('Failed to parse channel data:', e);
      }
    }
  }, [updateState]);

  // Check for OAuth callback on mount
  if (typeof window !== 'undefined') {
    handleOAuthCallback();
  }

  const resetWorkflow = () => {
    setState({
      currentStep: 0,
      topic: '',
      format: 'documentary',
      duration: '5-10 minutes',
      researchData: null,
      storyline: null,
      storylineIsDemo: false,
      thumbnailUrl: null,
      thumbnailIsDemo: false,
      videoTaskId: null,
      videoIsDemo: false,
      videoStatus: '',
      videoUrl: null,
      youtubeConnected: state.youtubeConnected,
      youtubeConfigured: state.youtubeConfigured,
      youtubeChannel: state.youtubeChannel,
      youtubePublishing: false,
      youtubePublishResult: null,
      loading: {
        research: false,
        storyline: false,
        thumbnail: false,
        video: false,
        youtube: false,
      },
      error: null,
    });
  };

  const progress = (state.currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-2 rounded-lg">
              <Youtube className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                YouTube Video Storyline Generator
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI-Powered Content Creation Workflow
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={resetWorkflow} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      state.currentStep >= index
                        ? 'bg-green-500 border-green-500 text-white'
                        : state.currentStep === index - 1
                        ? 'bg-white dark:bg-gray-800 border-green-500 text-green-500'
                        : 'bg-white dark:bg-gray-800 border-gray-300 text-gray-400'
                    }`}
                  >
                    {state.currentStep > index ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-sm font-medium mt-2 text-gray-700 dark:text-gray-300">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-24 h-1 mx-4 rounded transition-all ${
                      state.currentStep > index ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Error Display */}
        {state.error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="py-4">
              <p className="text-red-600 dark:text-red-400">{state.error}</p>
            </CardContent>
          </Card>
        )}

        {/* Step Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Configuration
              </CardTitle>
              <CardDescription>
                Enter your video topic and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Video Topic *</Label>
                <Input
                  id="topic"
                  placeholder="e.g., AI in Healthcare, Space Exploration..."
                  value={state.topic}
                  onChange={(e) => updateState({ topic: e.target.value })}
                  disabled={state.currentStep > 0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Video Format</Label>
                <Select
                  value={state.format}
                  onValueChange={(value) => updateState({ format: value })}
                  disabled={state.currentStep > 1}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="documentary">Documentary</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                    <SelectItem value="vlog">Vlog</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="explainer">Explainer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Target Duration</Label>
                <Select
                  value={state.duration}
                  onValueChange={(value) => updateState({ duration: value })}
                  disabled={state.currentStep > 1}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-3 minutes">Short (1-3 min)</SelectItem>
                    <SelectItem value="5-10 minutes">Medium (5-10 min)</SelectItem>
                    <SelectItem value="10-20 minutes">Long (10-20 min)</SelectItem>
                    <SelectItem value="20+ minutes">Extended (20+ min)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-2">
                {state.currentStep === 0 && (
                  <Button
                    className="w-full"
                    onClick={handleResearch}
                    disabled={!state.topic.trim() || state.loading.research}
                  >
                    {state.loading.research ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Researching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Research Topic
                      </>
                    )}
                  </Button>
                )}

                {state.currentStep === 1 && (
                  <Button
                    className="w-full"
                    onClick={handleGenerateStoryline}
                    disabled={state.loading.storyline}
                  >
                    {state.loading.storyline ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Storyline
                      </>
                    )}
                  </Button>
                )}

                {state.currentStep === 2 && (
                  <Button
                    className="w-full"
                    onClick={() => handleGenerateThumbnail()}
                    disabled={state.loading.thumbnail}
                  >
                    {state.loading.thumbnail ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Generate Thumbnail
                      </>
                    )}
                  </Button>
                )}

                {state.currentStep === 3 && (
                  <Button
                    className="w-full"
                    onClick={handleGenerateVideo}
                    disabled={state.loading.video}
                  >
                    {state.loading.video ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {state.videoStatus === 'PROCESSING' ? 'Processing...' : 'Starting...'}
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Generate Video Clip
                      </>
                    )}
                  </Button>
                )}

                {state.currentStep === 4 && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => updateState({ currentStep: 3 })}
                    >
                      Generate Another Video Clip
                    </Button>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={resetWorkflow}
                    >
                      Create New Video
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Research Results */}
            {state.researchData && state.currentStep >= 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-500" />
                    Research Results
                    <Badge variant="secondary">{state.researchData.trending?.length || 0} results</Badge>
                    {state.researchData.isDemo && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        Demo Mode
                      </Badge>
                    )}
                  </CardTitle>
                  {state.researchData.isDemo && (
                    <CardDescription className="text-amber-600">
                      Web Search API rate limit reached. Using sample data to demonstrate the workflow.
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {state.researchData.trending?.slice(0, 5).map((result, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium text-sm">{result.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{result.snippet}</p>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-2"
                        >
                          {result.host_name}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Storyline */}
            {state.storyline && state.currentStep >= 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-500" />
                      Generated Storyline
                      {state.storylineIsDemo && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Demo Mode
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(state.storyline || '')}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </CardTitle>
                  {state.storylineIsDemo && (
                    <CardDescription className="text-amber-600">
                      LLM API rate limit reached. Using sample storyline to demonstrate the workflow.
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none max-h-96 overflow-y-auto">
                    <div className="whitespace-pre-wrap text-sm">
                      {state.storyline}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Thumbnail */}
            {state.thumbnailUrl && state.currentStep >= 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-green-500" />
                    Generated Thumbnail
                    {state.thumbnailIsDemo && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        Demo Mode
                      </Badge>
                    )}
                  </CardTitle>
                  {state.thumbnailIsDemo && (
                    <CardDescription className="text-amber-600">
                      Image Generation API rate limit reached. Using placeholder thumbnail to demonstrate the workflow.
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={state.thumbnailUrl}
                      alt="Generated thumbnail"
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateThumbnail()}
                      disabled={state.loading.thumbnail}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Regenerate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={state.thumbnailUrl} download={state.thumbnailIsDemo ? "thumbnail_demo.svg" : "thumbnail.png"}>
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Video */}
            {state.videoTaskId && state.currentStep >= 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-red-500" />
                    Video Generation
                    <Badge variant={state.videoStatus === 'SUCCESS' ? 'default' : 'secondary'}>
                      {state.videoStatus || 'Starting...'}
                    </Badge>
                    {state.videoIsDemo && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        Demo Mode
                      </Badge>
                    )}
                  </CardTitle>
                  {state.videoIsDemo && (
                    <CardDescription className="text-amber-600">
                      Video Generation API rate limit reached. Using sample video to demonstrate the workflow.
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {state.videoStatus === 'PROCESSING' && (
                    <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                      <div>
                        <p className="font-medium">Generating video...</p>
                        <p className="text-sm text-gray-500">This may take a few minutes</p>
                      </div>
                    </div>
                  )}

                  {state.videoStatus === 'SUCCESS' && state.videoUrl && (
                    <div className="space-y-4">
                      <div className="relative rounded-lg overflow-hidden bg-black">
                        <video
                          src={state.videoUrl}
                          controls
                          className="w-full h-auto"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={state.videoUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Open in New Tab
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 5: YouTube Publishing */}
            {state.currentStep >= 4 && state.videoStatus === 'SUCCESS' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-500" />
                    Publish to YouTube
                    {state.youtubePublishResult?.success && (
                      <Badge variant="default" className="bg-green-500">
                        Published!
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Upload your video directly to your YouTube channel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Connection Status */}
                  {!state.youtubeConnected ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                          <Youtube className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Not connected to YouTube</p>
                          <p className="text-sm text-gray-500">Connect your account to publish videos</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Button
                          onClick={connectYouTube}
                          className="w-full bg-red-500 hover:bg-red-600"
                        >
                          <Link2 className="w-4 h-4 mr-2" />
                          Connect YouTube Account
                        </Button>
                        <Button
                          onClick={connectDemoMode}
                          variant="outline"
                          className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Use Demo Mode
                        </Button>
                      </div>
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          ⚠️ YouTube API not configured. Use Demo Mode to simulate publishing, 
                          or add YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET to your environment 
                          variables for real publishing.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Channel Info */}
                      {state.youtubeChannel && (
                        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <img
                            src={state.youtubeChannel.thumbnail}
                            alt={state.youtubeChannel.title}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{state.youtubeChannel.title}</p>
                            <p className="text-sm text-gray-500">
                              {state.youtubeChannel.subscriberCount} subscribers
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={disconnectYouTube}
                          >
                            <Unlink className="w-4 h-4 mr-1" />
                            Disconnect
                          </Button>
                        </div>
                      )}

                      {/* Publish Button */}
                      {!state.youtubePublishResult ? (
                        <Button
                          onClick={publishToYouTube}
                          disabled={state.loading.youtube}
                          className="w-full bg-red-500 hover:bg-red-600"
                        >
                          {state.loading.youtube ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Publish to YouTube
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span className="text-sm">{state.youtubePublishResult.message}</span>
                          </div>
                          {state.youtubePublishResult.videoUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="w-full"
                            >
                              <a
                                href={state.youtubePublishResult.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                View on YouTube
                              </a>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {state.currentStep === 0 && !state.loading.research && (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Youtube className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Start Your Video Creation Journey
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Enter a topic to begin the AI-powered workflow for creating YouTube video content.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Skills Used Section */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            AI Skills Integration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Search,
                name: 'Web Search',
                description: 'Research trending topics and gather context',
                color: 'text-blue-500',
                bg: 'bg-blue-100 dark:bg-blue-900/20',
              },
              {
                icon: FileText,
                name: 'LLM',
                description: 'Generate engaging storylines and scripts',
                color: 'text-purple-500',
                bg: 'bg-purple-100 dark:bg-purple-900/20',
              },
              {
                icon: ImageIcon,
                name: 'Image Generation',
                description: 'Create eye-catching thumbnails',
                color: 'text-green-500',
                bg: 'bg-green-100 dark:bg-green-900/20',
              },
              {
                icon: Video,
                name: 'Video Generation',
                description: 'Produce video clips from descriptions',
                color: 'text-red-500',
                bg: 'bg-red-100 dark:bg-red-900/20',
              },
            ].map((skill) => (
              <Card key={skill.name} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className={`w-10 h-10 rounded-lg ${skill.bg} flex items-center justify-center mb-3`}>
                    <skill.icon className={`w-5 h-5 ${skill.color}`} />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{skill.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{skill.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Production Solutions Section */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Solving Rate Limits for Production
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Solution 1: User API Keys */}
            <Card className="border-2 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Users className="w-5 h-5" />
                  User-Supplied API Keys
                </CardTitle>
                <CardDescription>
                  Recommended: Let users bring their own API keys
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    Each user has their own rate limits
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    No shared quota between users
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    Keys stored locally (never on servers)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    Best for public applications
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Solution 2: Request Queue */}
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Clock className="w-5 h-5" />
                  Request Queue & Throttling
                </CardTitle>
                <CardDescription>
                  Control the rate of API requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5" />
                    Queue requests and process sequentially
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5" />
                    Implement exponential backoff
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5" />
                    Show wait times to users
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5" />
                    Prevent quota exhaustion
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Solution 3: Caching */}
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Zap className="w-5 h-5" />
                  Smart Caching
                </CardTitle>
                <CardDescription>
                  Reduce duplicate API calls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5" />
                    Cache responses for similar topics
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5" />
                    Use Redis for distributed caching
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5" />
                    Set appropriate TTL values
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5" />
                    Invalidate on content changes
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Solution 4: Demo Mode */}
            <Card className="border-2 border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Info className="w-5 h-5" />
                  Graceful Fallbacks
                </CardTitle>
                <CardDescription>
                  Maintain UX when rate limited
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5" />
                    Show demo content when limited
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5" />
                    Clear indicators for demo mode
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5" />
                    Queue requests for later
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5" />
                    Notify when quota resets
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Implementation Note */}
          <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Implementation Available
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    This demo includes caching, rate limiting, and demo mode fallbacks. 
                    For production, consider adding user API key configuration (see <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">src/components/ApiSettingsPanel.tsx</code>).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <p>YouTube Video Storyline Generator - AI-Powered Content Creation</p>
            <p>Powered by Z.ai Web Dev SDK</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
