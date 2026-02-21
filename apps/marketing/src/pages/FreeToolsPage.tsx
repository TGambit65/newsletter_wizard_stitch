import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Hash, Clock, DollarSign, AlertTriangle, CheckCircle2, Copy, RotateCcw } from 'lucide-react'

// ─── Subject Line Scorer ───────────────────────────────────────────────────
const spamWords = [
  'free', 'guarantee', 'act now', 'click here', 'make money', 'earn money',
  'winner', 'cash', 'prize', 'urgent', 'limited time', 'buy now', 'order now',
  'double your', 'risk free', 'no cost', 'no obligation', 'special promotion',
  'lose weight', 'this is not spam', 'you won', 'congratulations', '!!!', '???',
]
const powerWords = [
  'secret', 'proven', 'results', 'discover', 'reveal', 'mistake', 'warning',
  'exclusive', 'strategy', 'inside', 'truth', 'stop', 'simple', 'quick',
  'exactly', 'step-by-step', 'never', 'always', 'why', 'how', 'what',
]

function scoreSubjectLine(subject: string) {
  if (!subject.trim()) return { score: 0, issues: [], good: [] }
  const lower = subject.toLowerCase()
  const issues: string[] = []
  const good: string[] = []
  let score = 50

  // Length scoring
  const len = subject.length
  if (len >= 40 && len <= 55) { score += 20; good.push(`Good length (${len} chars — ideal 40–55)`) }
  else if (len > 55 && len <= 70) { score += 8; issues.push(`Slightly long (${len} chars — may be cut on mobile)`) }
  else if (len > 70) { score -= 15; issues.push(`Too long (${len} chars — will be truncated)`) }
  else if (len < 20) { score -= 10; issues.push(`Very short (${len} chars — may seem vague)`) }
  else { good.push(`Acceptable length (${len} chars)`) }

  // Spam words
  const foundSpam = spamWords.filter(w => lower.includes(w))
  if (foundSpam.length > 0) {
    score -= foundSpam.length * 12
    issues.push(`Spam trigger word(s): "${foundSpam.join('", "')}"`)
  }

  // Power words
  const foundPower = powerWords.filter(w => lower.includes(w))
  if (foundPower.length > 0) {
    score += Math.min(foundPower.length * 8, 16)
    good.push(`Power word(s) detected: "${foundPower.join('", "')}"`)
  }

  // ALL CAPS words
  const capsWords = subject.match(/[A-Z]{4,}/g) || []
  if (capsWords.length > 0) {
    score -= 15; issues.push(`Avoid all-caps words: "${capsWords.join('", "')}"`)
  }

  // Numbers (specific = good)
  if (/\d/.test(subject)) { score += 8; good.push('Contains a specific number (increases credibility)') }

  // Question
  if (subject.includes('?')) { score += 5; good.push('Uses a question (invites curiosity)') }

  // Excessive punctuation
  const excl = (subject.match(/!/g) || []).length
  if (excl > 1) { score -= excl * 5; issues.push(`${excl} exclamation marks — reduce to 0 or 1`) }

  // Personal pronoun
  if (/\byou\b|\byour\b/i.test(subject)) { score += 7; good.push('Uses "you/your" (reader-focused)') }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    good,
  }
}

function SubjectLineTool() {
  const [subject, setSubject] = useState('')
  const result = useMemo(() => scoreSubjectLine(subject), [subject])

  const scoreColor = result.score >= 75 ? 'bg-emerald-500' : result.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
  const scoreLabel = result.score >= 75 ? 'Strong' : result.score >= 50 ? 'Needs work' : 'Poor'

  return (
    <div className="tool-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <Mail className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-white">Subject Line Scorer</h3>
          <p className="text-white/45 text-xs">Type yours in — it'll score it and tell you exactly what to fix</p>
        </div>
      </div>

      <input
        type="text"
        className="input-field mb-4"
        placeholder="Type or paste your subject line..."
        value={subject}
        onChange={e => setSubject(e.target.value)}
        maxLength={200}
      />

      {subject.length > 0 && (
        <div className="space-y-4">
          {/* Score */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="score-bar">
                <div className={`score-fill ${scoreColor}`} style={{ width: `${result.score}%` }} />
              </div>
            </div>
            <div className="text-right w-20">
              <span className="font-display text-2xl font-bold text-white">{result.score}</span>
              <span className="text-white/40 text-sm">/100</span>
              <div className={`text-xs font-medium ${result.score >= 75 ? 'text-emerald-400' : result.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {scoreLabel}
              </div>
            </div>
          </div>

          {/* Character count */}
          <div className="text-xs text-white/40 -mt-2">
            {subject.length} characters {subject.length > 55 && <span className="text-amber-400">(aim for under 55)</span>}
          </div>

          {/* Issues */}
          {result.issues.length > 0 && (
            <div className="space-y-1.5">
              {result.issues.map(i => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {i}
                </div>
              ))}
            </div>
          )}

          {/* Good signals */}
          {result.good.length > 0 && (
            <div className="space-y-1.5">
              {result.good.map(g => (
                <div key={g} className="flex items-start gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {g}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!subject && (
        <div className="text-xs text-white/25 text-center py-4">Start typing to see your score</div>
      )}
    </div>
  )
}

// ─── Character Counter ─────────────────────────────────────────────────────
const platformLimits = [
  { name: 'Twitter / X', limit: 280, optimal: 200, note: 'No links in body — put in reply' },
  { name: 'LinkedIn', limit: 3000, optimal: 1200, note: 'First 210 chars = visible before "more"' },
  { name: 'Instagram', limit: 2200, optimal: 300, note: 'First 125 chars visible in feed' },
  { name: 'TikTok', limit: 2200, optimal: 150, note: 'First 100 visible; keep hook short' },
  { name: 'Facebook', limit: 63206, optimal: 80, note: '40–80 chars = highest engagement' },
  { name: 'YouTube Community', limit: 5000, optimal: 300, note: 'Shorter performs better in feed' },
  { name: 'Newsletter subject', limit: 70, optimal: 55, note: 'Mobile cutoff ~55–60 chars' },
  { name: 'Email preview text', limit: 130, optimal: 90, note: 'Complements subject line' },
]

function CharacterCounterTool() {
  const [text, setText] = useState('')
  const count = text.length

  return (
    <div className="tool-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-violet-600/15 flex items-center justify-center">
          <Hash className="w-4.5 h-4.5 text-violet-400" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-white">Multi-Platform Character Counter</h3>
          <p className="text-white/45 text-xs">Paste anything — see every platform limit turn red or green at once</p>
        </div>
      </div>

      <textarea
        className="input-field min-h-[120px] resize-y mb-4 text-sm"
        placeholder="Paste or type your post here..."
        value={text}
        onChange={e => setText(e.target.value)}
      />

      <div className="text-center text-3xl font-display font-bold text-white mb-4">
        {count} <span className="text-white/30 text-lg font-normal">characters</span>
      </div>

      <div className="space-y-2">
        {platformLimits.map(p => {
          const pct = Math.min((count / p.limit) * 100, 100)
          const overOptimal = count > p.optimal
          const overLimit = count > p.limit
          return (
            <div key={p.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/60">{p.name}</span>
                <span className={`text-xs font-mono ${overLimit ? 'text-red-400' : overOptimal ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {count}/{p.limit}
                  {overLimit && ' — OVER LIMIT'}
                  {!overLimit && overOptimal && ` (optimal ≤${p.optimal})`}
                </span>
              </div>
              <div className="score-bar">
                <div
                  className={`score-fill ${overLimit ? 'bg-red-500' : overOptimal ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {count > 0 && <div className="text-white/25 text-xs mt-0.5">{p.note}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Reading Time Estimator ────────────────────────────────────────────────
function ReadingTimeTool() {
  const [text, setText] = useState('')

  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const chars = text.length
    const sentences = (text.match(/[.!?]+/g) || []).length
    const avgWPM = 238 // average adult silent reading speed (Nielsen Norman, 2023)
    const minutes = words / avgWPM
    const secs = Math.round(minutes * 60)

    let timeStr = ''
    if (words === 0) timeStr = '—'
    else if (secs < 60) timeStr = `${secs} sec`
    else if (minutes < 2) timeStr = `1 min ${secs - 60}s`
    else timeStr = `${Math.round(minutes)} min`

    const lengthLabel =
      words < 150 ? 'Very short — social post / hook' :
      words < 400 ? 'Short — good for social or email intro' :
      words < 800 ? 'Medium — ideal newsletter length' :
      words < 1500 ? 'Long-form — deep-dive newsletter' :
      'Very long — consider breaking into series'

    return { words, chars, sentences, timeStr, minutes, lengthLabel }
  }, [text])

  return (
    <div className="tool-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-emerald-600/15 flex items-center justify-center">
          <Clock className="w-4.5 h-4.5 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-white">Reading Time Estimator</h3>
          <p className="text-white/45 text-xs">238 WPM — that's the Nielsen Norman Group's average. Paste your draft and see where you land.</p>
        </div>
      </div>

      <textarea
        className="input-field min-h-[140px] resize-y mb-4 text-sm"
        placeholder="Paste your full newsletter or article here..."
        value={text}
        onChange={e => setText(e.target.value)}
      />

      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: 'Reading time', value: stats.timeStr, color: 'text-emerald-400' },
          { label: 'Word count', value: stats.words.toLocaleString(), color: 'text-white' },
          { label: 'Characters', value: stats.chars.toLocaleString(), color: 'text-white' },
        ].map(s => (
          <div key={s.label} className="bg-white/4 rounded-xl p-3 text-center">
            <div className={`font-display text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-white/40 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {text.length > 0 && (
        <div className="bg-white/4 rounded-lg px-4 py-3 text-xs text-white/60">
          {stats.lengthLabel}
        </div>
      )}
    </div>
  )
}

// ─── Email Revenue Calculator ──────────────────────────────────────────────
function RevenueCalcTool() {
  const [subs, setSubs] = useState('5000')
  const [openRate, setOpenRate] = useState('25')
  const [ctr, setCtr] = useState('3')
  const [convRate, setConvRate] = useState('2')
  const [aov, setAov] = useState('97')

  const calc = useMemo(() => {
    const s = parseFloat(subs) || 0
    const o = parseFloat(openRate) / 100 || 0
    const c = parseFloat(ctr) / 100 || 0
    const cv = parseFloat(convRate) / 100 || 0
    const a = parseFloat(aov) || 0

    const opens = Math.round(s * o)
    const clicks = Math.round(opens * c)
    const conversions = Math.round(clicks * cv)
    const revenue = conversions * a
    const rps = s > 0 ? (revenue / s) : 0 // revenue per subscriber

    return { opens, clicks, conversions, revenue, rps }
  }, [subs, openRate, ctr, convRate, aov])

  return (
    <div className="tool-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-amber-600/15 flex items-center justify-center">
          <DollarSign className="w-4.5 h-4.5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-white">Email Revenue Calculator</h3>
          <p className="text-white/45 text-xs">Run the numbers on what your list is actually worth per send</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        {[
          { label: 'List size (subscribers)', value: subs, setter: setSubs, suffix: '' },
          { label: 'Open rate (%)', value: openRate, setter: setOpenRate, suffix: '%' },
          { label: 'Click-through rate (%)', value: ctr, setter: setCtr, suffix: '%' },
          { label: 'Conversion rate (%)', value: convRate, setter: setConvRate, suffix: '%' },
          { label: 'Average order value ($)', value: aov, setter: setAov, suffix: '$' },
        ].map(f => (
          <div key={f.label}>
            <label className="block text-xs text-white/50 mb-1.5">{f.label}</label>
            <input
              type="number"
              className="input-field text-sm"
              value={f.value}
              onChange={e => f.setter(e.target.value)}
              min="0"
            />
          </div>
        ))}
      </div>

      <div className="bg-primary/10 border border-primary/25 rounded-xl p-5 space-y-3">
        <div className="font-display font-semibold text-white/80 text-xs uppercase tracking-wider mb-2">Results per send</div>
        {[
          { label: 'Emails opened', value: calc.opens.toLocaleString() },
          { label: 'Clicks', value: calc.clicks.toLocaleString() },
          { label: 'Conversions', value: calc.conversions.toLocaleString() },
        ].map(r => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-white/55">{r.label}</span>
            <span className="font-mono text-white/85">{r.value}</span>
          </div>
        ))}
        <div className="border-t border-white/10 pt-3 flex justify-between items-center">
          <span className="text-white/70 font-medium">Revenue per send</span>
          <span className="font-display text-2xl font-bold text-white">${calc.revenue.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/40">Revenue per subscriber</span>
          <span className="font-mono text-white/60">${calc.rps.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4 text-xs text-white/30 leading-relaxed">
        The math: (subscribers × open rate) × CTR × conversion rate × AOV. Industry benchmarks to check yourself against: open rate 20–25%, CTR 2–3%, conversion 1–3%. If revenue per subscriber is coming out under $0.50, something in the funnel is leaking.
      </div>
    </div>
  )
}

// ─── Post Formatter ────────────────────────────────────────────────────────
function PostFormatterTool() {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const formats = useMemo(() => {
    if (!input.trim()) return null
    const words = input.trim().split(/\s+/)
    const sentences = input.trim().split(/[.!?]+/).filter(Boolean)

    const twitterTruncate = (s: string) =>
      s.length <= 260 ? s : s.slice(0, 257) + '...'

    const linkedInFormat = (s: string) => {
      // Break into short paragraphs
      const paras = s.split('\n').filter(Boolean)
      if (paras.length === 1 && s.length > 100) {
        // Auto-break long single blocks at sentences
        return sentences.slice(0, 4).join('.\n\n').replace(/\n\n$/, '') + (sentences.length > 4 ? '...' : '.')
      }
      return s
    }

    const firstSentence = sentences[0]?.trim() + '.' || ''
    const tweet = twitterTruncate(firstSentence + (words.length > 30 ? '\n\nRead more 👇' : ''))
    const linkedin = linkedInFormat(input.slice(0, 1200)) + '\n\n#[add 3–5 relevant hashtags here]'
    const instagram = input.slice(0, 400) + (input.length > 400 ? '...\n\n[Add 3–5 hashtags below]' : '')
    const tiktok = firstSentence + '\n\n[Continue in video narration]'

    return { tweet, linkedin, instagram, tiktok }
  }, [input])

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="tool-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-pink-600/15 flex items-center justify-center">
          <Copy className="w-4.5 h-4.5 text-pink-400" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-white">Social Post Formatter</h3>
          <p className="text-white/45 text-xs">Paste your content, get a rough starting point for 4 platforms — then edit it to actually sound like you</p>
        </div>
      </div>

      <textarea
        className="input-field min-h-[120px] resize-y mb-4 text-sm"
        placeholder="Paste your newsletter excerpt, blog paragraph, or idea here..."
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      {formats && (
        <div className="space-y-4">
          {([
            { label: 'Twitter / X', text: formats.tweet, color: 'border-sky-600/30 bg-sky-600/5' },
            { label: 'LinkedIn', text: formats.linkedin, color: 'border-blue-600/30 bg-blue-600/5' },
            { label: 'Instagram', text: formats.instagram, color: 'border-pink-600/30 bg-pink-600/5' },
            { label: 'TikTok hook', text: formats.tiktok, color: 'border-rose-500/30 bg-rose-500/5' },
          ] as { label: string; text: string; color: string }[]).map(f => (
            <div key={f.label} className={`border rounded-xl p-4 ${f.color}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/60">{f.label}</span>
                <button
                  onClick={() => copy(f.text, f.label)}
                  className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {copied === f.label ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied === f.label ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed">{f.text}</p>
              <div className="text-white/25 text-xs mt-2">{f.text.length} chars</div>
            </div>
          ))}
          <p className="text-white/30 text-xs">These are starting points — always edit for your voice and platform context before posting.</p>
        </div>
      )}

      {!input && (
        <div className="text-xs text-white/25 text-center py-4">Paste content above to generate platform-adapted versions</div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────
const tools = [
  { id: 'subject', label: 'Subject Line Scorer', icon: Mail, color: 'text-primary' },
  { id: 'counter', label: 'Character Counter', icon: Hash, color: 'text-violet-400' },
  { id: 'reading', label: 'Reading Time', icon: Clock, color: 'text-emerald-400' },
  { id: 'revenue', label: 'Revenue Calculator', icon: DollarSign, color: 'text-amber-400' },
  { id: 'formatter', label: 'Post Formatter', icon: Copy, color: 'text-pink-400' },
]

export default function FreeToolsPage() {
  const [active, setActive] = useState('subject')

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-emerald-600/10 border border-emerald-500/30 rounded-full px-3 py-1 text-xs text-emerald-300 font-medium mb-4">
          5 Tools — Free Forever, No Login Required
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Free Writing Tools</h1>
        <p className="text-xl text-white/55 max-w-xl leading-relaxed">
          Five tools that actually do something useful — no login, no email, nothing to download. Runs entirely in your browser.
        </p>
      </div>

      {/* Tool tabs */}
      <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-surface-dark/50 border border-white/6 rounded-xl">
        {tools.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 min-w-[120px] justify-center ${
              active === id
                ? 'bg-primary text-white shadow-glow-sm'
                : 'text-white/55 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className={`w-4 h-4 ${active === id ? 'text-white' : color}`} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Active tool */}
      <div className="mb-8">
        {active === 'subject' && <SubjectLineTool />}
        {active === 'counter' && <CharacterCounterTool />}
        {active === 'reading' && <ReadingTimeTool />}
        {active === 'revenue' && <RevenueCalcTool />}
        {active === 'formatter' && <PostFormatterTool />}
      </div>

      {/* All tools preview */}
      <div className="bg-surface-dark border border-white/8 rounded-2xl p-6">
        <h2 className="font-display font-semibold text-white mb-1">What's in here</h2>
        <p className="text-white/45 text-xs mb-5">Click any to jump to it</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            {
              id: 'subject', title: 'Subject Line Scorer', desc: "Paste your subject line and get a score from 0–100, with specific callouts — spam words, length problems, things that are working. Fixes are right there in the feedback.",
            },
            {
              id: 'counter', title: 'Multi-Platform Character Counter', desc: "Type or paste anything. Every platform limit shows up at once — Twitter, LinkedIn, Instagram, TikTok, Facebook, YouTube, subject line, preheader. Green means you're good. Red means you're over.",
            },
            {
              id: 'reading', title: 'Reading Time Estimator', desc: "Paste your whole newsletter and see reading time, word count, and whether the length fits the format you're aiming for. Based on 238 WPM (Nielsen Norman Group's average for adult silent reading).",
            },
            {
              id: 'revenue', title: 'Email Revenue Calculator', desc: "Put in your list size, open rate, click rate, conversion rate, and average order value. See what a single send is worth — and what each subscriber is worth over time.",
            },
            {
              id: 'formatter', title: 'Social Post Formatter', desc: "Paste a chunk of your newsletter. Get rough starting points for Twitter, LinkedIn, Instagram, and TikTok — trimmed to fit each format. You still need to edit them. That's kind of the point.",
            },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                active === t.id
                  ? 'border-primary/40 bg-primary/8'
                  : 'border-white/6 hover:border-white/15 hover:bg-white/3'
              }`}
            >
              <div className="font-medium text-white/90 text-sm mb-1">{t.title}</div>
              <p className="text-white/45 text-xs leading-relaxed">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 bg-gradient-to-r from-primary/15 to-violet-600/10 border border-primary/25 rounded-2xl p-6 text-center">
        <h2 className="font-display text-xl font-bold text-white mb-2">Rather not do all this manually?</h2>
        <p className="text-white/55 text-sm mb-5 max-w-md mx-auto">
          Newsletter Wizard generates the subject line, preview text, newsletter body, and social posts from your own knowledge base — in your voice. You still review and edit it. You just don't start from scratch.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="https://app.newsletterwizard.io" className="btn-primary text-sm">Start for Free</a>
          <Link to="/newsletter-guide" className="btn-ghost text-sm">Keep reading the guide</Link>
        </div>
      </div>

      {/* Reset note */}
      <div className="mt-6 flex items-center gap-2 text-xs text-white/25 justify-center">
        <RotateCcw className="w-3 h-3" />
        All tools run entirely in your browser — nothing is sent to any server.
      </div>
    </div>
  )
}
