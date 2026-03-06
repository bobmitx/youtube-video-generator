'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Key, 
  Save, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Info
} from 'lucide-react';

interface ApiSettingsProps {
  onSave?: (settings: ApiSettings) => void;
}

interface ApiSettings {
  zaiApiKey?: string;
  enableCaching: boolean;
  enableDemoMode: boolean;
}

export function ApiSettingsPanel({ onSave }: ApiSettingsProps) {
  const [showKey, setShowKey] = useState(false);
  const [settings, setSettings] = useState<ApiSettings>({
    zaiApiKey: '',
    enableCaching: true,
    enableDemoMode: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real app, this would save to localStorage or a secure backend
    localStorage.setItem('youtube_workflow_settings', JSON.stringify(settings));
    setSaved(true);
    onSave?.(settings);
    
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings({
      zaiApiKey: '',
      enableCaching: true,
      enableDemoMode: true,
    });
    localStorage.removeItem('youtube_workflow_settings');
  };

  const hasApiKey = settings.zaiApiKey && settings.zaiApiKey.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          API Configuration
        </CardTitle>
        <CardDescription>
          Configure your API keys to avoid shared rate limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Banner */}
        <div className={`p-4 rounded-lg ${hasApiKey ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
          <div className="flex items-start gap-3">
            {hasApiKey ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            )}
            <div>
              <p className={`font-medium ${hasApiKey ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                {hasApiKey ? 'Custom API Key Configured' : 'Using Shared API Keys'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {hasApiKey 
                  ? 'You have your own rate limits. Requests will use your quota.'
                  : 'All users share the same rate limits. Consider adding your own API key for production use.'}
              </p>
            </div>
          </div>
        </div>

        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor="apiKey" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Z.ai API Key (Optional)
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="apiKey"
                type={showKey ? 'text' : 'password'}
                placeholder="Enter your API key..."
                value={settings.zaiApiKey}
                onChange={(e) => setSettings({ ...settings, zaiApiKey: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Get your API key from the Z.ai dashboard. Your key is stored locally and never sent to our servers.
          </p>
        </div>

        <Separator />

        {/* Feature Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Caching</p>
              <p className="text-sm text-gray-500">Cache API responses to reduce calls</p>
            </div>
            <Badge variant={settings.enableCaching ? 'default' : 'secondary'}>
              {settings.enableCaching ? 'On' : 'Off'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Demo Mode Fallback</p>
              <p className="text-sm text-gray-500">Show demo content when rate limited</p>
            </div>
            <Badge variant={settings.enableDemoMode ? 'default' : 'secondary'}>
              {settings.enableDemoMode ? 'On' : 'Off'}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <Trash2 className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">
                Why use your own API key?
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Separate rate limits from other users</li>
                <li>Higher request quotas for your account</li>
                <li>Better reliability in production</li>
                <li>Your key is stored locally, never on servers</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
