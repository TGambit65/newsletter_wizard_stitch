import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { supabase, Newsletter } from '@/lib/supabase';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Play, 
  Trophy,
  BarChart3,
  Mail,
  MousePointer,
  Users
} from 'lucide-react';
import clsx from 'clsx';

interface ABVariant {
  name: string;
  subject: string;
  content: string;
}

interface ABTest {
  id: string;
  newsletter_id: string;
  tenant_id: string;
  name: string;
  variants: ABVariant[];
  distribution: Record<string, number>;
  status: 'draft' | 'running' | 'completed';
  winner_variant: string | null;
  created_at: string;
  completed_at: string | null;
}

interface ABTestResult {
  id: string;
  test_id: string;
  variant: string;
  sends: number;
  opens: number;
  clicks: number;
}

export function ABTestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const toast = useToast();
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [test, setTest] = useState<ABTest | null>(null);
  const [results, setResults] = useState<ABTestResult[]>([]);
  const [variants, setVariants] = useState<ABVariant[]>([
    { name: 'A', subject: '', content: '' },
    { name: 'B', subject: '', content: '' }
  ]);
  const [distribution, setDistribution] = useState<Record<string, number>>({ A: 50, B: 50 });
  const [testName, setTestName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && tenant) {
      loadData();
    }
  }, [id, tenant]);

  async function loadData() {
    setLoading(true);
    
    // Load newsletter
    const { data: newsletterData } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', id)
      .single();
    
    if (newsletterData) {
      setNewsletter(newsletterData);
      setVariants([
        { name: 'A', subject: newsletterData.subject_line || '', content: newsletterData.content_html || '' },
        { name: 'B', subject: '', content: '' }
      ]);
    }

    // Check for existing test
    const { data: testData } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('newsletter_id', id)
      .maybeSingle();

    if (testData) {
      setTest(testData);
      setVariants(testData.variants || []);
      setDistribution(testData.distribution || { A: 50, B: 50 });
      setTestName(testData.name);

      // Load results
      const { data: resultsData } = await supabase
        .from('ab_test_results')
        .select('*')
        .eq('test_id', testData.id);
      
      setResults(resultsData || []);
    }

    setLoading(false);
  }

  function addVariant() {
    const nextLetter = String.fromCharCode(65 + variants.length); // A, B, C, ...
    const newVariants = [...variants, { name: nextLetter, subject: '', content: '' }];
    setVariants(newVariants);
    
    // Update distribution
    const equal = Math.floor(100 / newVariants.length);
    const newDist: Record<string, number> = {};
    newVariants.forEach((v, i) => {
      newDist[v.name] = i === 0 ? 100 - equal * (newVariants.length - 1) : equal;
    });
    setDistribution(newDist);
  }

  function removeVariant(index: number) {
    if (variants.length <= 2) return;
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
    
    const equal = Math.floor(100 / newVariants.length);
    const newDist: Record<string, number> = {};
    newVariants.forEach((v, i) => {
      newDist[v.name] = i === 0 ? 100 - equal * (newVariants.length - 1) : equal;
    });
    setDistribution(newDist);
  }

  function updateVariant(index: number, field: 'subject' | 'content', value: string) {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  }

  async function saveTest(): Promise<ABTest | null> {
    if (!tenant || !id) return null;
    setSaving(true);

    try {
      if (test) {
        // Update existing test
        await supabase
          .from('ab_tests')
          .update({
            name: testName,
            variants,
            distribution,
          })
          .eq('id', test.id);
        return test;
      } else {
        // Create new test
        const { data } = await supabase
          .from('ab_tests')
          .insert({
            newsletter_id: id,
            tenant_id: tenant.id,
            name: testName || `A/B Test for ${newsletter?.title}`,
            variants,
            distribution,
            status: 'draft',
          })
          .select()
          .single();

        if (data) {
          setTest(data);

          // Create result entries for each variant
          const resultEntries = variants.map(v => ({
            test_id: data.id,
            variant: v.name,
            sends: 0,
            opens: 0,
            clicks: 0,
          }));

          await supabase.from('ab_test_results').insert(resultEntries);
          return data;
        }
      }
    } catch (error) {
      console.error('Error saving test:', error);
      toast.error('Failed to save test');
    } finally {
      setSaving(false);
    }
    return null;
  }

  async function launchTest() {
    // Resolve the active test — save first if one doesn't exist yet.
    // We use the returned value rather than reading `test` state to avoid
    // a race where setState hasn't propagated before we read test?.id.
    const activeTest = test ?? await saveTest();
    if (!activeTest) return;

    // Update test status
    await supabase
      .from('ab_tests')
      .update({ status: 'running' })
      .eq('id', activeTest.id);

    // DEMO MODE: Simulated results for demonstration purposes.
    // Real A/B testing requires ESP webhook integration to track actual opens/clicks.
    // To implement real tracking:
    // 1. Configure ESP webhooks to call a Supabase edge function
    // 2. The edge function should update ab_test_results based on webhook events
    // 3. Each email should include tracking pixels and unique link parameters
    const simulatedResults = variants.map(v => ({
      test_id: activeTest.id,
      variant: v.name,
      sends: Math.floor(Math.random() * 500) + 100,
      opens: Math.floor(Math.random() * 200) + 50,
      clicks: Math.floor(Math.random() * 50) + 10,
    }));

    for (const result of simulatedResults) {
      await supabase
        .from('ab_test_results')
        .update(result)
        .eq('test_id', result.test_id)
        .eq('variant', result.variant);
    }

    await loadData();
  }

  async function declareWinner(variantName: string) {
    if (!test) return;
    
    await supabase
      .from('ab_tests')
      .update({ 
        status: 'completed', 
        winner_variant: variantName,
        completed_at: new Date().toISOString()
      })
      .eq('id', test.id);
    
    await loadData();
  }

  // Calculate statistics
  function getStats(variantName: string) {
    const result = results.find(r => r.variant === variantName);
    if (!result || result.sends === 0) {
      return { openRate: 0, clickRate: 0 };
    }
    return {
      openRate: ((result.opens / result.sends) * 100).toFixed(1),
      clickRate: ((result.clicks / result.sends) * 100).toFixed(1),
    };
  }

  // Simple chi-square calculation for significance
  function isSignificant(): boolean {
    if (results.length < 2) return false;
    const a = results.find(r => r.variant === 'A');
    const b = results.find(r => r.variant === 'B');
    if (!a || !b || a.sends < 30 || b.sends < 30) return false;
    
    const totalSends = a.sends + b.sends;
    const totalOpens = a.opens + b.opens;
    const expectedA = (a.sends * totalOpens) / totalSends;
    const expectedB = (b.sends * totalOpens) / totalSends;
    
    if (expectedA === 0 || expectedB === 0) return false;
    
    const chiSquare = 
      Math.pow(a.opens - expectedA, 2) / expectedA +
      Math.pow(b.opens - expectedB, 2) / expectedB;
    
    return chiSquare > 3.84; // p < 0.05
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/newsletters/${id}/edit`)}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">A/B Test</h1>
          <p className="text-neutral-500">{newsletter?.title}</p>
        </div>
      </div>

      {/* Test Status Badge */}
      {test && (
        <div className="mb-6">
          <span className={clsx(
            'px-3 py-1 rounded-full text-sm font-medium',
            test.status === 'draft' ? 'bg-neutral-100 text-neutral-600' :
            test.status === 'running' ? 'bg-info/10 text-info' :
            'bg-success/10 text-success'
          )}>
            {test.status === 'draft' ? 'Draft' : test.status === 'running' ? 'Running' : 'Completed'}
          </span>
          {test.winner_variant && (
            <span className="ml-2 px-3 py-1 bg-warning/10 text-warning rounded-full text-sm font-medium">
              Winner: Variant {test.winner_variant}
            </span>
          )}
        </div>
      )}

      {/* Test Name */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
          Test Name
        </label>
        <input
          type="text"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          placeholder="e.g., Subject Line Test - January"
          disabled={test?.status !== 'draft' && !!test}
          className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-50"
        />
      </div>

      {/* Variants */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Variants</h2>
          {(!test || test.status === 'draft') && variants.length < 4 && (
            <button
              onClick={addVariant}
              className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Variant
            </button>
          )}
        </div>

        <div className="space-y-6">
          {variants.map((variant, index) => {
            const stats = getStats(variant.name);
            const result = results.find(r => r.variant === variant.name);
            
            return (
              <div key={variant.name} className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-lg flex items-center justify-center font-bold">
                      {variant.name}
                    </span>
                    <span className="text-sm text-neutral-500">
                      {distribution[variant.name]}% of audience
                    </span>
                  </div>
                  {(!test || test.status === 'draft') && variants.length > 2 && (
                    <button
                      onClick={() => removeVariant(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Results (if test is running or completed) */}
                {result && (test?.status === 'running' || test?.status === 'completed') && (
                  <div className="grid grid-cols-4 gap-4 mb-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-neutral-500 text-xs mb-1">
                        <Users className="w-3 h-3" /> Sends
                      </div>
                      <p className="font-bold text-neutral-900 dark:text-white">{result.sends}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-neutral-500 text-xs mb-1">
                        <Mail className="w-3 h-3" /> Opens
                      </div>
                      <p className="font-bold text-neutral-900 dark:text-white">{result.opens}</p>
                      <p className="text-xs text-neutral-500">{stats.openRate}%</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-neutral-500 text-xs mb-1">
                        <MousePointer className="w-3 h-3" /> Clicks
                      </div>
                      <p className="font-bold text-neutral-900 dark:text-white">{result.clicks}</p>
                      <p className="text-xs text-neutral-500">{stats.clickRate}%</p>
                    </div>
                    <div className="flex items-center justify-center">
                      {test?.status === 'running' && (
                        <button
                          onClick={() => declareWinner(variant.name)}
                          className="px-3 py-1.5 text-xs bg-warning text-white rounded-lg hover:bg-warning/80 flex items-center gap-1"
                        >
                          <Trophy className="w-3 h-3" /> Winner
                        </button>
                      )}
                      {test?.winner_variant === variant.name && (
                        <span className="px-3 py-1.5 text-xs bg-warning/10 text-warning rounded-lg flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> Winner
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={variant.subject}
                      onChange={(e) => updateVariant(index, 'subject', e.target.value)}
                      disabled={test?.status !== 'draft' && !!test}
                      placeholder="Enter subject line..."
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Content Preview
                    </label>
                    <textarea
                      value={variant.content}
                      onChange={(e) => updateVariant(index, 'content', e.target.value)}
                      disabled={test?.status !== 'draft' && !!test}
                      placeholder="Enter content (or leave same as original)..."
                      rows={4}
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm font-mono resize-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distribution */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Traffic Distribution</h2>
        <div className="flex gap-2 mb-4">
          {variants.map((v) => (
            <div
              key={v.name}
              className="h-4 bg-primary-500 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${distribution[v.name]}%` }}
              title={`${v.name}: ${distribution[v.name]}%`}
            />
          ))}
        </div>
        <div className="flex gap-4">
          {variants.map((v) => (
            <div key={v.name} className="flex items-center gap-2">
              <span className="w-3 h-3 bg-primary-500 rounded-full" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {v.name}: {distribution[v.name]}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Statistical Significance */}
      {(test?.status === 'running' || test?.status === 'completed') && (
        <div className={clsx(
          'rounded-xl p-4 mb-6',
          isSignificant() 
            ? 'bg-success/10 border border-success/30' 
            : 'bg-warning/10 border border-warning/30'
        )}>
          <div className="flex items-center gap-2">
            <BarChart3 className={clsx('w-5 h-5', isSignificant() ? 'text-success' : 'text-warning')} />
            <span className={clsx('font-medium', isSignificant() ? 'text-success' : 'text-warning')}>
              {isSignificant() 
                ? 'Results are statistically significant (p < 0.05)' 
                : 'Not enough data for statistical significance yet'}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {(!test || test.status === 'draft') && (
          <>
            <button
              onClick={saveTest}
              disabled={saving}
              className="px-6 py-2.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={launchTest}
              disabled={!variants.every(v => v.subject)}
              className="px-6 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> Launch Test (Demo)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
