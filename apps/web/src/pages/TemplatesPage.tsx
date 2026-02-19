import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import {
  BookOpen,
  TrendingUp,
  MousePointerClick,
  Zap,
  Users,
  BarChart3,
  Megaphone,
  Star,
  X,
  Plus,
  Search,
  FileText,
} from 'lucide-react';
import clsx from 'clsx';

type Category = 'all' | 'promotional' | 'educational' | 'curated' | 'company-update' | 'product-launch' | 'event-recap';
type Goal = 'grow' | 'drive-clicks' | 're-engage' | 'inform';

interface SystemTemplate {
  id: string;
  name: string;
  description: string;
  category: Category;
  goal_tags: Goal[];
  content_html: string;
  avg_open_rate: number;
  avg_click_rate: number;
  usage_count: number;
  preview_lines: string[];
}

const SYSTEM_TEMPLATES: SystemTemplate[] = [
  {
    id: 'tpl-weekly-digest',
    name: 'Weekly Digest',
    description: "A curated roundup of the week's most important stories and insights.",
    category: 'curated',
    goal_tags: ['inform', 'grow'],
    avg_open_rate: 42.1,
    avg_click_rate: 8.3,
    usage_count: 1847,
    preview_lines: ['This Week in [Your Industry]', 'Top Stories · Quick Takes · Worth Reading'],
    content_html: '<h1>This Week in [Your Industry]</h1><p>Welcome back! Here\'s your weekly roundup of the stories that matter.</p><h2>Top Stories</h2><ul><li><strong>Story One</strong> — A brief explanation of why this matters to your readers.</li><li><strong>Story Two</strong> — What you need to know and what happens next.</li><li><strong>Story Three</strong> — The quick take on this development.</li></ul><h2>Quick Takes</h2><p>A few short observations on what\'s happening in the space this week.</p><h2>Worth Reading</h2><p>Three links worth your time this weekend.</p><hr/><p><em>Thanks for reading. See you next week.</em></p>',
  },
  {
    id: 'tpl-product-launch',
    name: 'Product Launch Announcement',
    description: 'Build excitement for a new product or feature with a benefit-focused announcement.',
    category: 'product-launch',
    goal_tags: ['drive-clicks', 'grow'],
    avg_open_rate: 38.7,
    avg_click_rate: 14.2,
    usage_count: 923,
    preview_lines: ['Introducing [Product Name]', 'Key features · Get started today'],
    content_html: '<h1>Introducing [Product Name]</h1><p>We\'ve been working on something big — and today it\'s finally here.</p><h2>What it does</h2><p>[Product Name] helps you [primary benefit] so you can [outcome]. No more [pain point].</p><h2>Key features</h2><ul><li><strong>Feature One</strong> — How it helps you.</li><li><strong>Feature Two</strong> — The time you\'ll save.</li><li><strong>Feature Three</strong> — Why this changes everything.</li></ul><h2>Get started today</h2><p>Early access is available now. Join the first wave and help shape what comes next.</p>',
  },
  {
    id: 'tpl-educational-deep-dive',
    name: 'Educational Deep Dive',
    description: 'Teach your audience one important concept with clarity and depth.',
    category: 'educational',
    goal_tags: ['inform', 'grow'],
    avg_open_rate: 45.3,
    avg_click_rate: 6.1,
    usage_count: 2341,
    preview_lines: ['Everything You Need to Know About [Topic]', 'The basics · Why it matters · What to do next'],
    content_html: '<h1>Everything You Need to Know About [Topic]</h1><p>Today I want to break down [topic] — what it is, why it matters, and how to use it.</p><h2>The basics</h2><p>Start with a clear definition and the context that makes it relevant right now.</p><h2>Why this matters</h2><p>Explain the stakes. What happens if readers understand this vs. don\'t?</p><h2>How it works</h2><p>Walk through the mechanism step by step. Use concrete examples.</p><h2>What to do next</h2><p>Give readers one clear action they can take based on what they\'ve learned.</p>',
  },
  {
    id: 'tpl-promotional',
    name: 'Promotional Offer',
    description: 'Drive conversions with a time-limited offer and clear call to action.',
    category: 'promotional',
    goal_tags: ['drive-clicks', 're-engage'],
    avg_open_rate: 31.4,
    avg_click_rate: 19.8,
    usage_count: 1205,
    preview_lines: ['[Limited Time] [Offer Headline]', 'Benefits · The offer · CTA'],
    content_html: '<h1>[Limited Time] [Offer Headline]</h1><p>This is your chance to [get the benefit] before [deadline].</p><h2>What you get</h2><ul><li>Benefit one</li><li>Benefit two</li><li>Benefit three</li></ul><h2>The offer</h2><p><strong>[X]% off / Free [thing] / Exclusive access</strong> — but only until [date].</p>',
  },
  {
    id: 'tpl-company-update',
    name: 'Company Update',
    description: "Keep your audience informed about company news, milestones, and what's coming next.",
    category: 'company-update',
    goal_tags: ['inform', 're-engage'],
    avg_open_rate: 36.9,
    avg_click_rate: 5.7,
    usage_count: 744,
    preview_lines: ['A Quick Update from [Company Name]', 'What we\'ve been up to · What\'s coming next'],
    content_html: '<h1>A Quick Update from [Company Name]</h1><p>Here\'s what\'s been happening and where we\'re headed.</p><h2>What we\'ve been up to</h2><p>Share the highlight reel of the last period — wins, learnings, and progress.</p><h2>A milestone worth celebrating</h2><p>We hit [milestone] — and we couldn\'t have done it without you.</p><h2>What\'s coming next</h2><p>Give a preview of upcoming features, events, or initiatives.</p>',
  },
  {
    id: 'tpl-event-recap',
    name: 'Event Recap',
    description: 'Capture the highlights and key takeaways from a recent event or conference.',
    category: 'event-recap',
    goal_tags: ['inform', 'grow'],
    avg_open_rate: 40.2,
    avg_click_rate: 7.4,
    usage_count: 512,
    preview_lines: ['[Event Name] — Key Takeaways', 'Big themes · Best sessions · What we\'re taking back'],
    content_html: '<h1>[Event Name] — Key Takeaways</h1><p>We just got back from [Event Name] and here are the most important things we learned.</p><h2>The big themes</h2><p>Three to five overarching themes that ran through the event.</p><h2>Best sessions</h2><ul><li><strong>Session by [Speaker]</strong> — One-sentence summary of the insight.</li></ul><h2>What we\'re taking back to work</h2><p>Concrete actions your team or audience can apply immediately.</p>',
  },
  {
    id: 'tpl-re-engage',
    name: 'Win-Back Campaign',
    description: 'Re-engage subscribers who have gone quiet with a personal, value-forward message.',
    category: 'promotional',
    goal_tags: ['re-engage'],
    avg_open_rate: 28.6,
    avg_click_rate: 11.3,
    usage_count: 389,
    preview_lines: ['We Miss You', 'What\'s new · A gift to welcome you back'],
    content_html: '<h1>We Miss You</h1><p>It\'s been a while — and we noticed.</p><p>We\'ve been busy building things we think you\'ll love. Here\'s a quick look at what\'s new since you last visited.</p><h2>What\'s new</h2><ul><li>New thing one</li><li>New thing two</li><li>New thing three you asked for</li></ul><h2>A gift to welcome you back</h2><p>Use <strong>[CODE]</strong> for [offer] — valid for the next 7 days.</p>',
  },
  {
    id: 'tpl-newsletter-growth',
    name: 'Subscriber Growth Edition',
    description: 'Designed to encourage shares and referrals with a strong community angle.',
    category: 'curated',
    goal_tags: ['grow', 'inform'],
    avg_open_rate: 44.8,
    avg_click_rate: 12.9,
    usage_count: 1023,
    preview_lines: ['The Edition Worth Sharing', 'Main story · Three things worth knowing · Forward this'],
    content_html: '<h1>The Edition Worth Sharing</h1><p>This week\'s issue is packed — forward it to someone who\'d find it useful.</p><h2>The main story</h2><p>Lead with your strongest insight, story, or analysis this week.</p><h2>Three things worth knowing</h2><ol><li>First insight with your unique perspective on it.</li><li>Second insight — why it matters.</li><li>Third insight — the contrarian take.</li></ol><h2>Know someone who\'d enjoy this?</h2><p>Forward this to a colleague or friend.</p>',
  },
  {
    id: 'tpl-case-study',
    name: 'Customer Case Study',
    description: 'Showcase a customer success story to build social proof and drive conversions.',
    category: 'educational',
    goal_tags: ['drive-clicks', 'grow'],
    avg_open_rate: 37.5,
    avg_click_rate: 10.6,
    usage_count: 617,
    preview_lines: ['How [Customer Name] [Achieved Result]', 'Challenge · Approach · Results · CTA'],
    content_html: '<h1>How [Customer Name] [Achieved Result]</h1><p>The challenge, the approach, and the outcome — in their own words.</p><h2>The challenge</h2><p>Before they found us, [Customer Name] was struggling with [specific problem].</p><h2>The results</h2><p><strong>[X]%</strong> improvement in [metric]. <strong>[Y]</strong> hours saved per week.</p><blockquote>"Quote from the customer about their experience." — Customer Name, Title</blockquote><h2>Want results like these?</h2>',
  },
  {
    id: 'tpl-thought-leadership',
    name: 'Thought Leadership',
    description: 'Establish authority with a bold opinion or contrarian take on your industry.',
    category: 'educational',
    goal_tags: ['grow', 'inform'],
    avg_open_rate: 48.2,
    avg_click_rate: 5.3,
    usage_count: 1456,
    preview_lines: ['[Contrarian Statement or Bold Claim]', 'The conventional wisdom · Why I disagree · What I believe instead'],
    content_html: '<h1>[Contrarian Statement or Bold Claim]</h1><p>I know this might be unpopular. But after [timeframe] in [industry], I believe it\'s true.</p><h2>The conventional wisdom</h2><p>Here\'s what everyone says you should do — and why it feels right on the surface.</p><h2>Why I disagree</h2><p>The evidence that\'s made me rethink this.</p><h2>What I believe instead</h2><p>The alternative framework. How to think about this differently.</p>',
  },
  {
    id: 'tpl-seasonal',
    name: 'Seasonal / Holiday Edition',
    description: 'Tie your content to a seasonal moment with warmth and a relevant offer or reflection.',
    category: 'promotional',
    goal_tags: ['re-engage', 'drive-clicks'],
    avg_open_rate: 39.1,
    avg_click_rate: 9.8,
    usage_count: 834,
    preview_lines: ['Happy [Season/Holiday] from [Company]', 'A reflection · Our gift to you · What\'s coming next'],
    content_html: '<h1>Happy [Season/Holiday] from [Company]</h1><p>As [this time of year] approaches, we wanted to take a moment to reach out.</p><h2>A reflection on the year</h2><p>What this period has meant for us — and for the community we\'re building together.</p><h2>Our gift to you</h2><p>As a thank-you for being part of our community: [offer, free resource, or special content].</p>',
  },
  {
    id: 'tpl-data-report',
    name: 'Data Report & Insights',
    description: 'Share original research, survey results, or industry data with expert commentary.',
    category: 'educational',
    goal_tags: ['grow', 'inform'],
    avg_open_rate: 50.7,
    avg_click_rate: 13.1,
    usage_count: 698,
    preview_lines: ['[Year] [Industry] Report: What the Data Says', 'The headline number · Key findings · What this means'],
    content_html: '<h1>[Year] [Industry] Report: What the Data Says</h1><p>We surveyed [N] [audience type] and here\'s what we found.</p><h2>The headline number</h2><p>Lead with the most surprising or significant data point.</p><h2>Key findings</h2><ul><li><strong>[X]%</strong> of respondents said [finding one].</li><li><strong>[Y]%</strong> reported [finding two].</li></ul><h2>What this means</h2><p>Your expert interpretation of the data.</p>',
  },
];

const CATEGORIES: { value: Category; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'all', label: 'All Templates', icon: BookOpen },
  { value: 'curated', label: 'Curated', icon: Star },
  { value: 'educational', label: 'Educational', icon: BarChart3 },
  { value: 'promotional', label: 'Promotional', icon: Megaphone },
  { value: 'company-update', label: 'Company Update', icon: Users },
  { value: 'product-launch', label: 'Product Launch', icon: Zap },
  { value: 'event-recap', label: 'Event Recap', icon: TrendingUp },
];

const GOALS: { value: Goal; label: string }[] = [
  { value: 'grow', label: 'Grow subscribers' },
  { value: 'drive-clicks', label: 'Drive clicks' },
  { value: 're-engage', label: 'Re-engage' },
  { value: 'inform', label: 'Inform' },
];

const CATEGORY_COLORS: Record<string, string> = {
  curated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  educational: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  promotional: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'company-update': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'product-launch': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'event-recap': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

export function TemplatesPage() {
  const { tenant } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [category, setCategory] = useState<Category>('all');
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<SystemTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [templates, setTemplates] = useState<SystemTemplate[]>(SYSTEM_TEMPLATES);

  useEffect(() => {
    if (!tenant) return;
    supabase
      .from('newsletter_templates')
      .select('*')
      .or(`is_system.eq.true,tenant_id.eq.${tenant.id}`)
      .order('avg_open_rate', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTemplates(data.map(row => ({
            id: row.id as string,
            name: row.name as string,
            description: (row.description || '') as string,
            category: (row.category || 'curated') as Category,
            goal_tags: (row.goal_tags || []) as Goal[],
            content_html: (row.content_html || '') as string,
            avg_open_rate: Number(row.avg_open_rate) || 0,
            avg_click_rate: Number(row.avg_click_rate) || 0,
            usage_count: Number(row.usage_count) || 0,
            preview_lines: (row.preview_lines || []) as string[],
          })));
        }
      })
      .catch(() => {
        // keep SYSTEM_TEMPLATES fallback
      });
  }, [tenant]);

  function toggleGoal(goal: Goal) {
    setActiveGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  }

  const filtered = useMemo(() => {
    return templates.filter(t => {
      if (category !== 'all' && t.category !== category) return false;
      if (activeGoals.length > 0 && !activeGoals.some(g => t.goal_tags.includes(g))) return false;
      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [category, activeGoals, searchQuery, templates]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => b.avg_open_rate - a.avg_open_rate), [filtered]);

  async function handleUseTemplate(template: SystemTemplate) {
    if (!tenant) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('newsletters')
        .insert({
          tenant_id: tenant.id,
          title: template.name,
          content_html: template.content_html,
          status: 'draft',
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (data) {
        toast.success('Newsletter created from template');
        navigate(`/newsletters/${data.id}/edit`);
      }
    } catch {
      toast.error('Failed to create newsletter from template');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Template Library</h1>
        <p className="text-neutral-500 mt-1">Start from a proven template and customize it to your voice</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search templates..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-dark border border-neutral-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                category === cat.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-surface-dark text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Goal filter pills */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        <span className="text-sm text-neutral-500 py-1">Goal:</span>
        {GOALS.map(goal => (
          <button
            key={goal.value}
            onClick={() => toggleGoal(goal.value)}
            className={clsx(
              'px-3 py-1 rounded-full text-sm font-medium border transition-colors',
              activeGoals.includes(goal.value)
                ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700'
                : 'bg-white dark:bg-surface-dark text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5'
            )}
          >
            {goal.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-neutral-500 mb-4">
        {sorted.length} template{sorted.length !== 1 ? 's' : ''}
        {(category !== 'all' || activeGoals.length > 0 || searchQuery) ? ' matching your filters' : ''}
      </p>

      {/* Template grid */}
      {sorted.length === 0 ? (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 p-12 text-center">
          <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">No templates match your filters</h3>
          <p className="text-neutral-500 text-sm">Try adjusting your category or goal filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(template => (
            <div
              key={template.id}
              className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              {/* Visual preview placeholder */}
              <div className="h-28 bg-neutral-50 dark:bg-background-dark p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 truncate">
                    {template.preview_lines[0]}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 truncate">{template.preview_lines[1]}</p>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full w-full" />
                  <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full w-4/5" />
                  <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full w-3/4" />
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm leading-tight">{template.name}</h3>
                  <span className={clsx('px-2 py-0.5 text-xs font-medium rounded-full capitalize flex-shrink-0', CATEGORY_COLORS[template.category])}>
                    {template.category.replace('-', ' ')}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mb-3 flex-1 leading-relaxed">{template.description}</p>

                <div className="flex items-center gap-4 text-xs text-neutral-400 mb-3">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {template.avg_open_rate.toFixed(1)}% open
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="w-3 h-3" />
                    {template.avg_click_rate.toFixed(1)}% click
                  </span>
                  <span>{template.usage_count.toLocaleString()} uses</span>
                </div>

                <div className="flex gap-1 flex-wrap mb-3">
                  {template.goal_tags.map(goal => (
                    <span key={goal} className="px-1.5 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded">
                      {GOALS.find(g => g.value === goal)?.label}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="flex-1 px-3 py-2 text-sm font-medium border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleUseTemplate(template)}
                    disabled={creating}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Use this
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setPreviewTemplate(null); }}
        >
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-white/10 flex-shrink-0">
              <div>
                <h2 className="font-semibold text-neutral-900 dark:text-white">{previewTemplate.name}</h2>
                <span className={clsx('inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full capitalize', CATEGORY_COLORS[previewTemplate.category])}>
                  {previewTemplate.category.replace('-', ' ')}
                </span>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                aria-label="Close preview"
                className="p-2 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-lg ml-4 flex-shrink-0"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <div className="p-6 overflow-auto flex-1 space-y-4">
              <p className="text-neutral-600 dark:text-neutral-400">{previewTemplate.description}</p>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-neutral-50 dark:bg-background-dark rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-neutral-700 dark:text-neutral-300 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5 text-success" />
                    {previewTemplate.avg_open_rate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">Avg open rate</p>
                </div>
                <div className="bg-neutral-50 dark:bg-background-dark rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-neutral-700 dark:text-neutral-300 font-semibold">
                    <MousePointerClick className="w-3.5 h-3.5 text-info" />
                    {previewTemplate.avg_click_rate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">Avg click rate</p>
                </div>
                <div className="bg-neutral-50 dark:bg-background-dark rounded-lg p-3 text-center">
                  <p className="text-neutral-700 dark:text-neutral-300 font-semibold">{previewTemplate.usage_count.toLocaleString()}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Times used</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Goal tags</p>
                <div className="flex gap-2 flex-wrap">
                  {previewTemplate.goal_tags.map(goal => (
                    <span key={goal} className="px-2.5 py-1 text-sm bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full">
                      {GOALS.find(g => g.value === goal)?.label}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Structure</p>
                <div className="bg-neutral-50 dark:bg-background-dark rounded-lg p-3 space-y-1.5">
                  {previewTemplate.preview_lines.map((line, i) => (
                    <p key={i} className={clsx('text-sm', i === 0 ? 'font-medium text-neutral-900 dark:text-white' : 'text-neutral-500')}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-200 dark:border-white/10 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2.5 text-sm font-medium border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5"
              >
                Close
              </button>
              <button
                onClick={() => { setPreviewTemplate(null); handleUseTemplate(previewTemplate); }}
                disabled={creating}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Use this template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
