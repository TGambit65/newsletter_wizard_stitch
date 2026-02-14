import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Newsletter } from '@/lib/supabase';
import { api } from '@/lib/api';
import { 
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Video,
  MessageCircle,
  Play
} from 'lucide-react';
import clsx from 'clsx';

interface SocialPosts {
  twitter: {
    main_post: string;
    hashtags: string[];
    thread?: string[] | null;
  };
  linkedin: {
    post: string;
    hashtags: string[];
  };
  facebook: {
    post: string;
    cta: string;
  };
  instagram: {
    caption: string;
    hashtags: string[];
    image_suggestion: string;
  };
  tiktok: {
    hook: string;
    script: string;
    video_prompt: string;
  };
  youtube_shorts: {
    hook: string;
    script: string;
    video_prompt: string;
  };
  threads: {
    post: string;
    hashtags: string[];
  };
  reddit: {
    title: string;
    body: string;
    subreddit_suggestions: string[];
  };
  pinterest: {
    title: string;
    description: string;
    keywords: string[];
    board_suggestion: string;
  };
  snapchat: {
    hook: string;
    script: string;
    duration: string;
  };
}

type PlatformKey = keyof SocialPosts;

const PLATFORM_CONFIG: Record<PlatformKey, { 
  name: string; 
  color: string; 
  bgColor: string;
  charLimit: number;
  icon: React.ComponentType<{ className?: string }>;
  isVideo?: boolean;
}> = {
  twitter: { name: 'Twitter / X', color: 'text-neutral-900', bgColor: 'bg-neutral-100', charLimit: 280, icon: Twitter },
  linkedin: { name: 'LinkedIn', color: 'text-blue-700', bgColor: 'bg-blue-50', charLimit: 3000, icon: Linkedin },
  facebook: { name: 'Facebook', color: 'text-blue-600', bgColor: 'bg-blue-50', charLimit: 5000, icon: Facebook },
  instagram: { name: 'Instagram', color: 'text-pink-600', bgColor: 'bg-pink-50', charLimit: 2200, icon: Instagram },
  tiktok: { name: 'TikTok', color: 'text-neutral-900', bgColor: 'bg-neutral-100', charLimit: 2200, icon: Video, isVideo: true },
  youtube_shorts: { name: 'YouTube Shorts', color: 'text-red-600', bgColor: 'bg-red-50', charLimit: 5000, icon: Play, isVideo: true },
  threads: { name: 'Threads', color: 'text-neutral-900', bgColor: 'bg-neutral-100', charLimit: 500, icon: MessageCircle },
  reddit: { name: 'Reddit', color: 'text-orange-600', bgColor: 'bg-orange-50', charLimit: 40000, icon: MessageCircle },
  pinterest: { name: 'Pinterest', color: 'text-red-700', bgColor: 'bg-red-50', charLimit: 500, icon: Instagram },
  snapchat: { name: 'Snapchat', color: 'text-yellow-600', bgColor: 'bg-yellow-50', charLimit: 2200, icon: Video, isVideo: true },
};

function PlatformIcon({ platform, className }: { platform: PlatformKey; className?: string }) {
  const Icon = PLATFORM_CONFIG[platform].icon;
  return <Icon className={className} />;
}

export function SocialMediaPage() {
  const { id } = useParams<{ id: string }>();
  const { tenant } = useAuth();
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [posts, setPosts] = useState<Partial<SocialPosts> | null>(null);
  const [editedPosts, setEditedPosts] = useState<Partial<SocialPosts> | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PlatformKey>('twitter');

  useEffect(() => {
    if (id && tenant) {
      loadNewsletter();
    }
  }, [id, tenant]);

  async function loadNewsletter() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('newsletters')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenant!.id)
        .single();
      
      if (data) {
        setNewsletter(data);
        await generatePosts(data);
      }
    } catch (error) {
      console.error('Error loading newsletter:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generatePosts(nl: Newsletter) {
    setGenerating(true);
    try {
      const result = await api.generateSocialPosts({
        newsletter_content: nl.content_html || '',
        newsletter_title: nl.title,
      });
      
      if (result.posts) {
        setPosts(result.posts as Partial<SocialPosts>);
        setEditedPosts(result.posts as Partial<SocialPosts>);
      }
    } catch (error) {
      console.error('Error generating social posts:', error);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerate() {
    if (newsletter) {
      await generatePosts(newsletter);
    }
  }

  function handleCopy(text: string, platform: string) {
    navigator.clipboard.writeText(text);
    setCopied(platform);
    setTimeout(() => setCopied(null), 2000);
  }

  function getPostText(platform: PlatformKey): string {
    if (!editedPosts) return '';
    
    switch (platform) {
      case 'twitter': {
        const post = editedPosts.twitter;
        if (!post) return '';
        return `${post.main_post}${post.hashtags?.length ? '\n\n' + post.hashtags.map(h => `#${h}`).join(' ') : ''}`;
      }
      case 'linkedin': {
        const post = editedPosts.linkedin;
        if (!post) return '';
        return `${post.post}${post.hashtags?.length ? '\n\n' + post.hashtags.map(h => `#${h}`).join(' ') : ''}`;
      }
      case 'facebook': {
        const post = editedPosts.facebook;
        if (!post) return '';
        return `${post.post}${post.cta ? '\n\n' + post.cta : ''}`;
      }
      case 'instagram': {
        const post = editedPosts.instagram;
        if (!post) return '';
        return `${post.caption}${post.hashtags?.length ? '\n\n' + post.hashtags.map(h => `#${h}`).join(' ') : ''}`;
      }
      case 'tiktok': {
        const post = editedPosts.tiktok;
        if (!post) return '';
        return `${post.hook}\n\n${post.script}`;
      }
      case 'youtube_shorts': {
        const post = editedPosts.youtube_shorts;
        if (!post) return '';
        return `${post.hook}\n\n${post.script}`;
      }
      case 'threads': {
        const post = editedPosts.threads;
        if (!post) return '';
        return `${post.post}${post.hashtags?.length ? '\n\n' + post.hashtags.map(h => `#${h}`).join(' ') : ''}`;
      }
      case 'reddit': {
        const post = editedPosts.reddit;
        return `${post?.title || ''}\n\n${post?.body || ''}`;
      }
      case 'pinterest': {
        const post = editedPosts.pinterest;
        return `${post?.title || ''}\n\n${post?.description || ''}${post?.keywords?.length ? '\n\n' + post.keywords.join(', ') : ''}`;
      }
      case 'snapchat': {
        const post = editedPosts.snapchat;
        return `${post?.hook || ''}\n\n${post?.script || ''}\n\nDuration: ${post?.duration || '15s'}`;
      }
      default:
        return '';
    }
  }

  function updatePostText(platform: PlatformKey, text: string) {
    if (!editedPosts) return;
    
    const updated = { ...editedPosts };
    
    // Parse the text back into structured format
    const lines = text.split('\n\n');
    const hashtagLine = lines.find(l => l.startsWith('#'));
    const hashtags = hashtagLine ? hashtagLine.match(/#\w+/g)?.map(h => h.slice(1)) || [] : [];
    const mainText = lines.filter(l => !l.startsWith('#')).join('\n\n');
    
    switch (platform) {
      case 'twitter':
        updated.twitter = { ...updated.twitter, main_post: mainText, hashtags };
        break;
      case 'linkedin':
        updated.linkedin = { ...updated.linkedin, post: mainText, hashtags };
        break;
      case 'facebook':
        updated.facebook = { ...updated.facebook, post: mainText };
        break;
      case 'instagram':
        updated.instagram = { ...updated.instagram, caption: mainText, hashtags };
        break;
      case 'tiktok': {
        const [hook, ...rest] = mainText.split('\n\n');
        updated.tiktok = { ...updated.tiktok, hook: hook || '', script: rest.join('\n\n') || '' };
        break;
      }
      case 'youtube_shorts': {
        const [ytHook, ...ytRest] = mainText.split('\n\n');
        updated.youtube_shorts = { ...updated.youtube_shorts, hook: ytHook || '', script: ytRest.join('\n\n') || '' };
        break;
      }
      case 'threads':
        updated.threads = { ...updated.threads, post: mainText, hashtags };
        break;
      case 'reddit': {
        const [title, ...bodyParts] = mainText.split('\n\n');
        updated.reddit = { ...updated.reddit, title: title || '', body: bodyParts.join('\n\n') || '' };
        break;
      }
      case 'pinterest': {
        const [pinTitle, ...descParts] = mainText.split('\n\n');
        const keywords = lines.find(l => l.includes(','))?.split(',').map(k => k.trim()) || [];
        updated.pinterest = { ...updated.pinterest, title: pinTitle || '', description: descParts.filter(p => !p.includes(',')).join('\n\n'), keywords };
        break;
      }
      case 'snapchat': {
        const [snapHook, ...snapRest] = mainText.split('\n\n');
        updated.snapchat = { ...updated.snapchat, hook: snapHook || '', script: snapRest.filter(r => !r.startsWith('Duration:')).join('\n\n') };
        break;
      }
    }
    
    setEditedPosts(updated);
  }

  function getCharCount(platform: PlatformKey): number {
    const text = getPostText(platform);
    return text.length;
  }

  function isOverLimit(platform: PlatformKey): boolean {
    return getCharCount(platform) > PLATFORM_CONFIG[platform].charLimit;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!newsletter) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-neutral-500">Newsletter not found</p>
        <Link to="/newsletters" className="text-primary-600 hover:underline mt-4 inline-block">
          Back to Newsletters
        </Link>
      </div>
    );
  }

  const platforms = Object.keys(PLATFORM_CONFIG) as PlatformKey[];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to={`/newsletters/${id}/edit`}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Social Media Posts</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Generated from: {newsletter.title}
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={clsx('w-4 h-4', generating && 'animate-spin')} />
          {generating ? 'Generating...' : 'Regenerate All'}
        </button>
      </div>

      {/* Platform Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-neutral-200 dark:border-neutral-700 pb-4">
        {platforms.map((platform) => {
          const config = PLATFORM_CONFIG[platform];
          return (
            <button
              key={platform}
              onClick={() => setActiveTab(platform)}
              className={clsx(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                activeTab === platform
                  ? `${config.bgColor} ${config.color}`
                  : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
              )}
            >
              <PlatformIcon platform={platform} className="w-4 h-4" />
              {config.name}
              {config.isVideo && (
                <span className="px-1.5 py-0.5 text-xs bg-neutral-200 dark:bg-neutral-600 rounded">Video</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Platform Card */}
      {editedPosts && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {/* Platform Header */}
          <div className={clsx('px-6 py-4 flex items-center justify-between', PLATFORM_CONFIG[activeTab].bgColor)}>
            <div className="flex items-center gap-3">
              <PlatformIcon platform={activeTab} className={clsx('w-6 h-6', PLATFORM_CONFIG[activeTab].color)} />
              <div>
                <h2 className={clsx('font-semibold', PLATFORM_CONFIG[activeTab].color)}>
                  {PLATFORM_CONFIG[activeTab].name}
                </h2>
                <p className="text-xs text-neutral-500">
                  {PLATFORM_CONFIG[activeTab].charLimit.toLocaleString()} character limit
                </p>
              </div>
            </div>
            <button
              onClick={() => handleCopy(getPostText(activeTab), activeTab)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors text-sm font-medium"
            >
              {copied === activeTab ? (
                <>
                  <Check className="w-4 h-4 text-success" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6">
            <textarea
              value={getPostText(activeTab)}
              onChange={(e) => updatePostText(activeTab, e.target.value)}
              rows={8}
              className="w-full p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none font-mono text-sm"
            />
            
            {/* Character Count */}
            <div className="flex items-center justify-between mt-3">
              <span className={clsx(
                'text-sm font-medium',
                isOverLimit(activeTab) ? 'text-error' : 'text-neutral-500'
              )}>
                {getCharCount(activeTab).toLocaleString()} / {PLATFORM_CONFIG[activeTab].charLimit.toLocaleString()} characters
                {isOverLimit(activeTab) && ' (over limit)'}
              </span>
            </div>

            {/* Video Platform Extras */}
            {PLATFORM_CONFIG[activeTab].isVideo && editedPosts[activeTab] && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <h3 className="font-medium text-neutral-900 dark:text-white mb-2">Video Generation Prompt</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                    {(editedPosts[activeTab] as typeof editedPosts.tiktok).video_prompt}
                  </p>
                </div>
                <button
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-medium"
                  onClick={() => {
                    // Placeholder - just copy the prompt
                    handleCopy((editedPosts[activeTab] as typeof editedPosts.tiktok).video_prompt, `${activeTab}-video`);
                  }}
                >
                  <Video className="w-5 h-5" />
                  Generate Video (Coming Soon)
                </button>
              </div>
            )}

            {/* Instagram Image Suggestion */}
            {activeTab === 'instagram' && editedPosts.instagram.image_suggestion && (
              <div className="mt-6 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                <h3 className="font-medium text-pink-900 dark:text-pink-100 mb-2">Suggested Image</h3>
                <p className="text-sm text-pink-700 dark:text-pink-300">
                  {editedPosts.instagram.image_suggestion}
                </p>
              </div>
            )}

            {/* Twitter Thread */}
            {activeTab === 'twitter' && editedPosts.twitter.thread && editedPosts.twitter.thread.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-neutral-900 dark:text-white mb-3">Thread Posts</h3>
                <div className="space-y-3">
                  {editedPosts.twitter.thread.map((post, index) => (
                    <div key={index} className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-neutral-500">Tweet {index + 1}</span>
                        <button
                          onClick={() => handleCopy(post, `thread-${index}`)}
                          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                        >
                          {copied === `thread-${index}` ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4 text-neutral-500" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{post}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {generating && !editedPosts && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto mb-4" />
          <p className="text-neutral-500">Generating social media posts...</p>
        </div>
      )}
    </div>
  );
}
