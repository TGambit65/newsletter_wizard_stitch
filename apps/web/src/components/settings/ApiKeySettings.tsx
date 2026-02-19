import { useState } from 'react';
import { Eye, EyeOff, Save, Check } from 'lucide-react';

interface ApiKeySettingsProps {
  openaiKey: string;
  anthropicKey: string;
  sendgridKey: string;
  mailchimpKey: string;
  convertkitKey: string;
  espProvider: string;
  savingKeys: boolean;
  keysSaved: boolean;
  onOpenaiChange: (v: string) => void;
  onAnthropicChange: (v: string) => void;
  onSendgridChange: (v: string) => void;
  onMailchimpChange: (v: string) => void;
  onConvertkitChange: (v: string) => void;
  onEspProviderChange: (v: string) => void;
  onSave: () => void;
}

export function ApiKeySettings({
  openaiKey,
  anthropicKey,
  sendgridKey,
  mailchimpKey,
  convertkitKey,
  espProvider,
  savingKeys,
  keysSaved,
  onOpenaiChange,
  onAnthropicChange,
  onSendgridChange,
  onMailchimpChange,
  onConvertkitChange,
  onEspProviderChange,
  onSave,
}: ApiKeySettingsProps) {
  const [showOpenai, setShowOpenai] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showSendgrid, setShowSendgrid] = useState(false);
  const [showMailchimp, setShowMailchimp] = useState(false);
  const [showConvertkit, setShowConvertkit] = useState(false);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">API Keys</h2>
      <p className="text-neutral-500 text-sm mb-6">Configure your AI provider and ESP API keys.</p>

      <div className="space-y-6">
        {/* AI Provider Keys */}
        <div className="space-y-4">
          <h3 className="font-medium text-neutral-900 dark:text-white">AI Providers</h3>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              OpenAI API Key
            </label>
            <div className="relative">
              <input
                type={showOpenai ? 'text' : 'password'}
                value={openaiKey}
                onChange={(e) => onOpenaiChange(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-3 pr-12 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowOpenai(!showOpenai)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showOpenai ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Anthropic API Key <span className="text-neutral-400">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type={showAnthropic ? 'text' : 'password'}
                value={anthropicKey}
                onChange={(e) => onAnthropicChange(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-4 py-3 pr-12 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowAnthropic(!showAnthropic)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showAnthropic ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ESP Keys */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-4">
          <h3 className="font-medium text-neutral-900 dark:text-white">Email Service Provider</h3>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Default ESP Provider
            </label>
            <select
              value={espProvider}
              onChange={(e) => onEspProviderChange(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="sendgrid">SendGrid</option>
              <option value="mailchimp">Mailchimp</option>
              <option value="convertkit">ConvertKit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              SendGrid API Key
            </label>
            <div className="relative">
              <input
                type={showSendgrid ? 'text' : 'password'}
                value={sendgridKey}
                onChange={(e) => onSendgridChange(e.target.value)}
                placeholder="SG..."
                className="w-full px-4 py-3 pr-12 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowSendgrid(!showSendgrid)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showSendgrid ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Mailchimp API Key
            </label>
            <div className="relative">
              <input
                type={showMailchimp ? 'text' : 'password'}
                value={mailchimpKey}
                onChange={(e) => onMailchimpChange(e.target.value)}
                placeholder="xxx-dc"
                className="w-full px-4 py-3 pr-12 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowMailchimp(!showMailchimp)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showMailchimp ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              ConvertKit API Secret
            </label>
            <div className="relative">
              <input
                type={showConvertkit ? 'text' : 'password'}
                value={convertkitKey}
                onChange={(e) => onConvertkitChange(e.target.value)}
                placeholder="API Secret"
                className="w-full px-4 py-3 pr-12 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConvertkit(!showConvertkit)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showConvertkit ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-4">
          <button
            onClick={onSave}
            disabled={savingKeys}
            className="px-6 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {savingKeys ? 'Saving...' : 'Save API Keys'}
          </button>
          {keysSaved && (
            <span className="text-success flex items-center gap-1 text-sm">
              <Check className="w-4 h-4" /> Saved successfully
            </span>
          )}
        </div>

        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Security Note:</strong> Your API keys are stored securely and are only used server-side.
          </p>
        </div>
      </div>
    </div>
  );
}
