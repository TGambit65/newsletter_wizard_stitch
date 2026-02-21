import { Link } from 'react-router-dom'
import {
  Mail, Share2, Wrench, ArrowRight, CheckCircle2, BookOpen,
  TrendingUp, Users, Clock, BarChart3, Sparkles, Shield
} from 'lucide-react'

const stats = [
  { value: '21.5%', label: 'Average open rate across all industries — email still beats every social feed', source: 'Mailchimp 2025' },
  { value: '2.3%', label: 'Average click-through rate — small number, but these are people who actually wanted to read', source: 'HubSpot' },
  { value: '$42', label: 'Back for every $1 spent on email — no other channel is even close', source: 'DMA' },
  { value: '4B+', label: 'People using email daily — more than Facebook, Instagram, and TikTok combined', source: 'Statista' },
]

const guides = [
  {
    icon: Mail,
    title: 'Newsletter Best Practices',
    desc: 'The things that actually move open rates — subject lines, send timing, keeping your list clean, and staying out of spam. Plus real benchmarks so you know where you stand.',
    href: '/newsletter-guide',
    color: 'from-primary/20 to-primary/5',
    border: 'border-primary/30',
    topics: ['Subject line formulas', 'Send time optimization', 'List hygiene', 'Deliverability (SPF/DKIM)', 'Open rate benchmarks'],
  },
  {
    icon: Share2,
    title: 'Social Media by Platform',
    desc: 'Six platforms, six different games. Character limits, how each algorithm actually works, what format gets reach, when to post — written for people who want to stop guessing.',
    href: '/social-media-guide',
    color: 'from-violet-600/20 to-violet-600/5',
    border: 'border-violet-500/30',
    topics: ['Twitter/X algorithm breakdown', 'LinkedIn reach without ads', 'Instagram Reels vs Feed', 'TikTok hook writing', 'Facebook for communities'],
  },
  {
    icon: Wrench,
    title: 'Free Writing Tools',
    desc: 'Score your subject lines before you send. Check character counts against every platform at once. Run your revenue numbers. No account, no email required — just use them.',
    href: '/free-tools',
    color: 'from-emerald-600/20 to-emerald-600/5',
    border: 'border-emerald-500/30',
    topics: ['Subject line scorer', 'Multi-platform character counter', 'Reading time calculator', 'Email revenue calculator', 'Post formatter'],
  },
]

const principles = [
  {
    icon: BookOpen,
    title: 'We cite our sources',
    desc: "Every benchmark comes from somewhere real — Mailchimp's annual report, HubSpot's research, Litmus, Sprout Social. If we can't point to a source, we say 'in our experience' and you can weigh that accordingly.",
  },
  {
    icon: Shield,
    title: 'No padding',
    desc: "We don't write content to fill a page or rank for keywords. If a section doesn't teach you something you can use, we cut it. Some guides are short. That's intentional.",
  },
  {
    icon: TrendingUp,
    title: 'We update when things change',
    desc: "Email and social algorithms shift constantly. We note when data was collected. If something was true in 2022 but isn't anymore, we say so — even if it makes the guide shorter.",
  },
  {
    icon: Sparkles,
    title: 'The tools are real',
    desc: "Our free tools run the same logic we use in Newsletter Wizard — the subject line scorer, the spam checker, the character limits. Not decorative. Actually useful.",
  },
]

const whyEmail = [
  { icon: Users, text: "You own the list. No algorithm decides who sees what you send — every subscriber gets it." },
  { icon: BarChart3, text: "Email drives 40× more customer acquisition than social media. That's not a rounding error." },
  { icon: Clock, text: "Subscribers opted in. They're not scrolling past you — they asked to hear from you." },
  { icon: CheckCircle2, text: "Segmented sends average 46% higher open rates than blasting the whole list." },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl animate-float" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Free guides and tools — no account needed
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Write newsletters people<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-violet-400">
              actually look forward to
            </span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-10">
            A free library of newsletter and social media best practices — plus tools you can use right now without signing up for anything.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/newsletter-guide" className="btn-primary">
              Read the Newsletter Guide
            </Link>
            <Link to="/free-tools" className="btn-ghost">
              Use Free Tools <ArrowRight className="inline w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 bg-surface-dark/40 py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(s => (
            <div key={s.value} className="text-center">
              <div className="font-display text-3xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-white/50 text-xs leading-snug">{s.label}</div>
              <div className="text-primary/60 text-xs mt-1">— {s.source}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why email still wins */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl font-bold text-white mb-4">
                Social reach has collapsed. Email hasn't.
              </h2>
              <p className="text-white/60 leading-relaxed mb-4">
                Facebook organic posts now reach somewhere between 2 and 5 percent of your followers — on a good day. Instagram isn't much better for most accounts. Twitter/X has been algorithmically deprioritizing link posts for years. You're building on someone else's land, and they keep changing the rent.
              </p>
              <p className="text-white/60 leading-relaxed mb-4">
                Email is different. When someone subscribes to your newsletter, they're saying "yes, send this to me." They don't have to scroll past it. They get it. All of them. Every time.
              </p>
              <p className="text-white/60 leading-relaxed">
                That doesn't mean you should abandon social — it's still how most people find you. But the goal on social should be moving your best readers onto your list. That's where the real relationship lives.
              </p>
            </div>
            <div className="space-y-4">
              {whyEmail.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 bg-surface-dark border border-white/8 rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Guides grid */}
      <section className="py-16 px-4 bg-surface-dark/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-white mb-3">Three resources. No fluff.</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              A newsletter guide, a social media guide broken down by platform, and a set of tools you can actually use — all free, all here.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {guides.map(({ icon: Icon, title, desc, href, color, border, topics }) => (
              <Link
                key={href}
                to={href}
                className={`group bg-gradient-to-b ${color} border ${border} rounded-2xl p-6 hover:scale-[1.01] transition-all flex flex-col`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-white/80" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-white/55 text-sm leading-relaxed mb-5 flex-1">{desc}</p>
                <ul className="space-y-1.5 mb-5">
                  {topics.map(t => (
                    <li key={t} className="flex items-center gap-2 text-xs text-white/50">
                      <CheckCircle2 className="w-3 h-3 text-primary/60 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                  Read guide <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why trust us */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-white mb-3">How we think about this stuff</h2>
            <p className="text-white/50 max-w-lg mx-auto">
              There's a lot of bad email advice on the internet. Here's where we're coming from.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {principles.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="stat-card">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-white text-sm mb-2">{title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-2xl p-10 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(51,13,242,0.3) 0%, rgba(30,27,46,0.95) 60%)' }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="font-display text-3xl font-bold text-white mb-3">
                Want to skip the manual part?
              </h2>
              <p className="text-white/60 mb-8 max-w-lg mx-auto">
                Newsletter Wizard pulls from your own knowledge base and writes in your voice. You still edit it — but you're not starting from a blank page anymore.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="https://app.newsletterwizard.io/signup" className="btn-primary">
                  Try It Free
                </a>
                <Link to="/newsletter-guide" className="btn-ghost">
                  Keep reading the guides
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
