import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail, Clock, Users, BarChart3, Shield, Smartphone, FlaskConical,
  AlertTriangle, CheckCircle2, ArrowRight, ChevronDown, ChevronUp
} from 'lucide-react'

const toc = [
  { id: 'subject-lines', label: 'Subject Lines', icon: Mail },
  { id: 'timing', label: 'Send Time & Frequency', icon: Clock },
  { id: 'content-structure', label: 'Content Structure', icon: BarChart3 },
  { id: 'list-hygiene', label: 'List Hygiene', icon: Users },
  { id: 'deliverability', label: 'Deliverability', icon: Shield },
  { id: 'mobile', label: 'Mobile Optimization', icon: Smartphone },
  { id: 'ab-testing', label: 'A/B Testing', icon: FlaskConical },
  { id: 'benchmarks', label: 'Benchmarks', icon: BarChart3 },
]

const industryBenchmarks = [
  { industry: 'Nonprofits', open: '27.2%', ctr: '3.4%' },
  { industry: 'Education', open: '25.7%', ctr: '3.0%' },
  { industry: 'Government', open: '25.1%', ctr: '2.9%' },
  { industry: 'Health & Fitness', open: '23.3%', ctr: '2.8%' },
  { industry: 'Financial Services', open: '21.8%', ctr: '2.5%' },
  { industry: 'Media / Publishing', open: '22.9%', ctr: '4.7%' },
  { industry: 'E-commerce / Retail', open: '18.4%', ctr: '2.1%' },
  { industry: 'SaaS / Tech', open: '21.1%', ctr: '2.3%' },
  { industry: 'Marketing & Advertising', open: '17.8%', ctr: '1.9%' },
  { industry: 'Real Estate', open: '19.7%', ctr: '1.8%' },
]

type FaqItem = { q: string; a: string }
const faqs: FaqItem[] = [
  {
    q: 'How often should I send?',
    a: "Weekly is the answer for most people — and we mean that genuinely, not as a cop-out. It's often enough that subscribers don't forget you, infrequent enough that each issue still feels like something worth reading. Daily only makes sense if your content is genuinely time-sensitive (morning news digests, market updates). Monthly and you're basically a stranger between sends. Start weekly, hold that cadence for at least three months, then adjust based on what your replies and unsubscribe patterns tell you.",
  },
  {
    q: "What's a good open rate for a new newsletter?",
    a: "Your first few hundred subscribers will open at 40–60% because they're the people who really wanted this. That's normal, and it will drop as you grow — don't treat it as a failure when it does. On a mature list of 5,000+, staying above 25% means you're doing well. Above 35% on a large list is genuinely impressive. If you're under 15%, something is wrong — either deliverability, content mismatch, or a list that hasn't been cleaned in a while.",
  },
  {
    q: 'Should I use a no-reply address?',
    a: "No. Full stop. No-reply addresses are a deliverability problem (replies are a positive engagement signal that inbox providers watch for) and they're also just a trust signal in the wrong direction. Use a real address someone monitors. A lot of the best newsletters send from a first name — kelly@yourcompany.com or something similar. When someone replies, they're telling you something valuable. Don't block that.",
  },
  {
    q: 'When do I clean my list?',
    a: "Anyone who hasn't opened in 90 days is cold. Before you remove them, run one re-engagement sequence — two emails over about a week. Keep the subject lines direct: 'Should I keep sending you this?' and then 'Last chance — click here to stay.' Don't guilt them. Don't discount anything. Just ask. Everyone who doesn't click gets removed. A 5,000-subscriber list at 45% open rate sends better and earns more than a 20,000-subscriber list at 8%. The second list will also get you flagged as spam eventually.",
  },
  {
    q: "Does unsubscribe rate matter more than open rate?",
    a: "They measure different things. Open rate tells you whether your subject lines and sender reputation are working. Unsubscribe rate tells you whether the content matches what people thought they were signing up for. High opens with high unsubscribes usually means you're writing clickbait subject lines that don't match the email. Under 0.5% unsubscribe rate per send is healthy. A spike above 1% is worth paying attention to — something in that send didn't land the way you expected.",
  },
]

function Faq({ q, a }: FaqItem) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/3 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium text-white/90 text-sm">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0 ml-4" /> : <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0 ml-4" />}
      </button>
      {open && (
        <div className="px-5 pb-5 text-white/60 text-sm leading-relaxed border-t border-white/5">
          <div className="pt-4">{a}</div>
        </div>
      )}
    </div>
  )
}

export default function NewsletterGuidePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-3 py-1 text-xs text-primary font-medium mb-4">
          <Mail className="w-3 h-3" /> Complete Guide — Updated 2026
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
          Newsletter Best Practices
        </h1>
        <p className="text-xl text-white/55 max-w-2xl leading-relaxed">
          The things that actually move open rates, keep you out of spam, and build a list people genuinely want to stay on.
        </p>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-24 bg-surface-dark border border-white/8 rounded-xl p-5">
            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">On this page</div>
            <nav className="space-y-1">
              {toc.map(({ id, label, icon: Icon }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="flex items-center gap-2.5 text-sm text-white/55 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all"
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-5 pt-5 border-t border-white/5">
              <Link to="/free-tools" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                <ArrowRight className="w-3 h-3" /> Free tools
              </Link>
            </div>
          </div>
        </aside>

        <div className="prose-guide space-y-4">

          {/* Subject Lines */}
          <section id="subject-lines">
            <h2>Subject Lines</h2>
            <p>
              Before any subscriber reads a word of your newsletter, they've already made a decision — open or delete. That decision takes about half a second and it's based almost entirely on your subject line. You're not competing with one or two other emails. The average inbox gets around 120 messages a day. Yours needs to earn the click.
            </p>

            <h3>Length</h3>
            <p>
              Forty to fifty-five characters. That's the range where open rates tend to be highest. Six to nine words, roughly. Short enough that mobile inboxes don't clip it, long enough to actually say something meaningful.
            </p>
            <p>
              You'll hear a lot of "shorter is always better" advice — it's not quite right. A three-word subject line works once, when the vagueness itself is the hook. For everything after that, the reader needs a reason to open. Give them one.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 my-5">
              <div className="tip-card">
                <div className="text-xs font-semibold text-primary mb-2">Works well</div>
                <ul className="space-y-1.5 text-sm text-white/70">
                  <li>"Why most newsletters fail in year two"</li>
                  <li>"3 email mistakes I made with 50k subscribers"</li>
                  <li>"Your list is worth more than you think — here's the math"</li>
                  <li>"The re-engagement sequence that got 40% back"</li>
                </ul>
              </div>
              <div className="warn-card">
                <div className="text-xs font-semibold text-amber-400 mb-2">Avoid these</div>
                <ul className="space-y-1.5 text-sm text-white/70">
                  <li>"HUGE NEWS inside!!!" — vague and shouting</li>
                  <li>"Fw: Fw: You won't believe this"</li>
                  <li>"[Newsletter] Weekly Update — Issue #47"</li>
                  <li>"Don't miss this limited time offer" — spam trigger</li>
                </ul>
              </div>
            </div>

            <h3>First-name personalization</h3>
            <p>
              Adding the subscriber's first name to the subject line bumps open rates by around 26% on average (Campaign Monitor, 2024). But only if your list is clean. "Hi [FNAME]" showing up for a subscriber who never entered their name is worse than no personalization at all. Most ESPs let you set a fallback — use it.
            </p>

            <h3>Numbers work. Vague claims don't.</h3>
            <p>
              "3 ways to cut your bounce rate" outperforms "How to reduce bounces." "We lost $12,000 — here's what happened" outperforms "A costly mistake." Specificity signals that the content is real. Readers have gotten good at filtering out generic headlines — specific ones feel like they were written by someone who actually did the thing.
            </p>

            <h3>Questions</h3>
            <p>
              Questions work when the reader genuinely doesn't know the answer — and wants to. "Are you making this onboarding mistake?" can work. "Want to grow your newsletter?" does not. The test: would a stranger actually wonder about this? If the answer is obviously yes or obviously no, skip the question.
            </p>

            <h3>Spam trigger words</h3>
            <p>
              Words like "free," "guarantee," "act now," "click here," "make money," and anything with excessive caps or exclamation marks will get you flagged — either by spam filters or by readers who've been conditioned to skip them. Use the spam checker in our free tools before you send. It takes 10 seconds.
            </p>

            <h3>The preview text (your second subject line)</h3>
            <p>
              Most people don't think about preview text at all. That's a mistake — it shows up right next to your subject line in Gmail, Apple Mail, Outlook. It's the second thing a reader sees before deciding to open.
            </p>
            <ul>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> Keep it 40–130 characters. Too short gets filled in with random email body text.</li>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> Don't repeat the subject line word for word. Add something new.</li>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> Tease the first real hook of the email — give them one more reason to click.</li>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> If you don't set it manually, your ESP will pull from the email body — often "View in browser." Don't let that happen.</li>
            </ul>
          </section>

          {/* Timing */}
          <section id="timing">
            <h2>Send Time & Frequency</h2>
            <p>
              Send time matters less than people think, and frequency matters more. A great email at the "wrong" time beats a mediocre email at the "optimal" time every single time. But here's what the research actually says.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 my-5">
              {[
                { day: 'Tuesday', note: 'Top performer across most industries, most years', rank: '#1' },
                { day: 'Wednesday', note: 'Strong for B2B and professional audiences specifically', rank: '#2' },
                { day: 'Thursday', note: 'Second half of the week still beats Monday or Friday', rank: '#3' },
              ].map(d => (
                <div key={d.day} className="stat-card text-center">
                  <div className="text-xs text-primary/70 font-mono mb-1">{d.rank}</div>
                  <div className="font-display text-xl font-semibold text-white mb-1">{d.day}</div>
                  <p className="text-white/50 text-xs">{d.note}</p>
                </div>
              ))}
            </div>

            <h3>Time of day</h3>
            <p>
              For professional content aimed at people at work: <strong className="text-white/90">9–11 AM in the subscriber's timezone</strong> is where most research points. People are at their desks, inbox is fresh. For consumer newsletters — lifestyle, personal finance, creative stuff — <strong className="text-white/90">7–9 PM</strong> catches evening browsing. Avoid 3–5 PM (the afternoon slump is real) and anything after 9 PM.
            </p>
            <div className="tip-card my-4">
              <div className="text-xs font-semibold text-primary mb-2">Worth knowing</div>
              <p className="text-white/65 text-sm">
                Most major ESPs — Mailchimp, Klaviyo, ActiveCampaign — now offer AI-based send-time optimization that sends to each subscriber when they personally tend to open. For lists above 2,000 subscribers, this beats any fixed time you pick. If your platform offers it, use it. It's one of those features that actually works as advertised.
              </p>
            </div>

            <h3>Frequency</h3>
            <p>
              The right frequency is the highest frequency at which you can publish something genuinely worth reading. That's the whole rule. Sending more often just to stay visible is how you train your audience to ignore you.
            </p>
            <ul>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> <strong className="text-white/80">Daily</strong> — Only if your content is inherently time-sensitive. News digests, market updates. Requires a real content operation.</li>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> <strong className="text-white/80">3x per week</strong> — Works for high-engagement niches where readers are actively building a habit around you.</li>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> <strong className="text-white/80">Weekly</strong> — The sweet spot for most newsletters. Sustainable, expected, and feels like an event.</li>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> <strong className="text-white/80">Biweekly or monthly</strong> — Works for deep-dive content, but you're fighting reader memory. Not ideal for growth.</li>
            </ul>
            <p>
              Pick a day and stay on it. "Every Tuesday morning" is better than "whenever I have something good" — even if the Tuesday email is occasionally just okay. Predictability builds habit.
            </p>
          </section>

          {/* Content Structure */}
          <section id="content-structure">
            <h2>Content Structure</h2>
            <p>
              Most newsletters get read in under two minutes. Some of that's because readers are busy — but a lot of it is because most newsletters aren't structured to hold attention past the first paragraph.
            </p>

            <h3>Lead with the thing that matters</h3>
            <p>
              Don't bury your insight in paragraph three. Don't open with "In today's issue, I'll be covering three topics: X, Y, and Z." Open with the first interesting thing. The reader needs to know within 30 seconds why this issue is worth their time — or they won't give it their time.
            </p>

            <h3>Hook → value → one CTA</h3>
            <div className="space-y-3 my-5">
              {[
                {
                  step: '1. The hook (50–100 words)',
                  desc: "A story, a counterintuitive claim, a number that surprises. Not 'Welcome to issue #47.' Something that makes the reader think 'wait, tell me more.' Example: 'Last Tuesday I sent the worst email of my career. 40,000 people saw it. Here's what happened.'",
                },
                {
                  step: '2. The value',
                  desc: "Deliver the actual thing. Use headers, bullets, and breathing room — not walls of text. If you're writing for 1,000 readers and 800 of them already know something, cut it. Every paragraph should earn the next one.",
                },
                {
                  step: '3. One call to action',
                  desc: "One thing. Not 'follow me on Twitter, reply to this email, share with a friend, and check out my course.' Pick the most important one. Everything else competes with it — and when everything competes, nothing gets clicked.",
                },
              ].map(s => (
                <div key={s.step} className="bg-surface-dark border border-white/8 rounded-xl p-5">
                  <div className="font-display font-semibold text-white/90 text-sm mb-1.5">{s.step}</div>
                  <p className="text-white/60 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>

            <h3>How long should it be?</h3>
            <p>
              As long as it needs to be — not a word more. For most weekly newsletters, that's 400–800 words. Long-form works if your audience opted in specifically for depth (paid newsletters, research digests). But if you're writing 2,000 words because you feel like you should, cut it in half. Readers can feel padding.
            </p>

            <h3>One topic per issue</h3>
            <p>
              Newsletters that try to cover three separate topics teach readers to skim. One topic, one clear angle, one takeaway. Link roundups are the exception — that format sets the expectation upfront. Everything else: go one level deeper on one thing.
            </p>
          </section>

          {/* List Hygiene */}
          <section id="list-hygiene">
            <h2>List Hygiene</h2>
            <p>
              A clean list sends better, costs less, and actually tells you the truth about how your content is performing. If half your list hasn't opened in six months, your open rate is lying to you — and your deliverability is suffering for it.
            </p>

            <h3>Hard bounces vs soft bounces</h3>
            <div className="grid sm:grid-cols-2 gap-4 my-4">
              <div className="stat-card">
                <div className="font-semibold text-white/90 text-sm mb-2">Hard bounce</div>
                <p className="text-white/55 text-xs">The address doesn't exist or the domain is gone. Remove immediately, permanently. Sending to hard bounces is one of the fastest ways to tank your sender reputation.</p>
              </div>
              <div className="stat-card">
                <div className="font-semibold text-white/90 text-sm mb-2">Soft bounce</div>
                <p className="text-white/55 text-xs">Temporary — inbox full, server issue. Most ESPs retry automatically. If the same address soft bounces three or more times in a row, treat it like a hard bounce and remove it.</p>
              </div>
            </div>

            <h3>The 90-day rule</h3>
            <p>
              Anyone who hasn't opened in 90 days is cold. Before removing them, send a two-email re-engagement sequence. Keep it simple — no guilt, no discounts, just a direct question.
            </p>
            <ul>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> Email 1: "Still want to hear from me?" — honest and direct.</li>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> Email 2 (3 days later): "Last chance — click here to stay on the list."</li>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> No click after email 2? Remove them. You can't help someone who isn't reading.</li>
            </ul>

            <h3>Double opt-in: worth it?</h3>
            <p>
              Double opt-in (confirming via a second email click) typically reduces signup rate by 20–30%. But the subscribers who confirm tend to be 50–80% more engaged. If you're a content-first newsletter where quality matters more than volume, it's worth it. If you're running paid acquisition and optimizing for list growth, single opt-in with aggressive ongoing hygiene is more common. Neither is wrong — it depends on your model.
            </p>

            <h3>Segmentation</h3>
            <p>
              Segmented campaigns average 46% higher open rates and 58% higher clicks than blasting the whole list (Mailchimp, 2024). You don't need a complicated setup to start. Three segments is enough to make a meaningful difference:
            </p>
            <ul>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> New subscribers (first 30 days) — they need onboarding, not your regular content rhythm</li>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> High engagement (opens most sends) — these people are your real fans, treat them differently</li>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> Topic-specific (if you cover multiple areas) — send people what they actually care about</li>
            </ul>
          </section>

          {/* Deliverability */}
          <section id="deliverability">
            <h2>Deliverability</h2>
            <p>
              Deliverability is whether your email actually reaches the inbox. The technical setup is mostly a one-time thing, but getting it wrong means all your subject line work is invisible. Nobody sees the email that lands in spam.
            </p>

            <div className="space-y-4 my-5">
              {[
                {
                  name: 'SPF (Sender Policy Framework)',
                  level: 'Required',
                  color: 'text-red-400',
                  desc: "A DNS record that tells receiving mail servers which IPs are authorized to send from your domain. Without it, you're fighting an uphill deliverability battle every send. Set it up once in your DNS settings — your ESP will give you the exact record to add.",
                },
                {
                  name: 'DKIM (DomainKeys Identified Mail)',
                  level: 'Required',
                  color: 'text-red-400',
                  desc: "Adds a cryptographic signature to your emails so receiving servers can verify they weren't tampered with in transit. Your ESP handles the signing — you just add their public key to your DNS. Also a one-time setup.",
                },
                {
                  name: 'DMARC',
                  level: 'Strongly recommended',
                  color: 'text-amber-400',
                  desc: "Tells receiving servers what to do when SPF or DKIM fails — reject it, quarantine it, or let it through. Also gives you reports showing who's trying to spoof your domain. Start with p=none (monitoring only), move to p=quarantine once you've confirmed your legitimate mail is passing cleanly.",
                },
                {
                  name: 'Custom sending domain',
                  level: 'Important',
                  color: 'text-amber-400',
                  desc: "Sending from your own domain (hello@yoursite.com) instead of a shared ESP domain means your sender reputation is yours — it builds over time and isn't shared with other senders on the same platform. Set this up before you hit 500 subscribers.",
                },
              ].map(item => (
                <div key={item.name} className="bg-surface-dark border border-white/8 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-semibold text-white/90 text-sm">{item.name}</span>
                    <span className={`text-xs font-medium ${item.color}`}>{item.level}</span>
                  </div>
                  <p className="text-white/55 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <h3>Engagement is a deliverability signal</h3>
            <p>
              Gmail and Outlook watch what people do with your emails — opens, clicks, replies, even moving you from spam to inbox. A disengaged list actively hurts your sender score. This is the real reason list hygiene matters for deliverability: dead subscribers drag everyone else down with them.
            </p>

            <div className="warn-card my-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-amber-400 mb-1">Don't buy lists. Ever.</div>
                  <p className="text-white/65 text-sm">
                    Purchased lists contain spam traps — email addresses set up specifically to catch senders who don't practice good hygiene. One hit can get your domain blacklisted. There's no legitimate use case for a purchased list if you're running a real newsletter.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Mobile */}
          <section id="mobile">
            <h2>Mobile Optimization</h2>
            <p>
              Roughly 46% of email opens happen on a mobile device (Litmus, 2025). An email that breaks on mobile loses nearly half your audience before they read a single sentence. The basics here aren't complicated — they just require actually checking.
            </p>
            <ul>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> Single-column layout. Two columns collapse badly on phones.</li>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> Max 600px wide. Wider requires horizontal scrolling.</li>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> 14–16px body text. Anything smaller and readers zoom to read, then close.</li>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> 44px minimum tap target on buttons. This is iOS's own guideline.</li>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> Alt text on images. A lot of clients block images by default — your email needs to work without them.</li>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> Set your preheader explicitly. If you don't, you get "View in browser" next to your subject line.</li>
              <li><CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5" /> Test in dark mode. Over 80% of iPhone users have it on (Apple, 2024).</li>
            </ul>
            <p>
              The easiest check: send a test to yourself on your phone before every send. It takes two minutes and catches things you'd never see on desktop.
            </p>
          </section>

          {/* A/B Testing */}
          <section id="ab-testing">
            <h2>A/B Testing</h2>
            <p>
              A/B testing one variable at a time builds a real understanding of what your specific audience responds to. Industry benchmarks are a starting point, but your readers are their own audience. The only way to know for sure is to test it.
            </p>

            <h3>What to test — in order of impact</h3>
            <div className="space-y-3 my-4">
              {[
                { test: 'Subject line', why: "Highest leverage of anything you can test. Controls whether the email gets opened at all. Test length, tone, personalization, question vs. statement, with/without numbers." },
                { test: 'Send time', why: "Test same-day different hours, or different days of the week. Run it across at least 3–4 sends before drawing conclusions — individual sends have too much random variance." },
                { test: 'From name', why: "Founder name vs. newsletter name vs. 'Name at Company.' Personal names tend to win for content newsletters. Brand names tend to win for transactional email." },
                { test: 'Preview text', why: "The most underrated test. A single line change here can move open rates 3–5%. Most people never touch it." },
                { test: 'CTA copy', why: "'Read more' vs. 'See the breakdown' vs. 'Get the data' — specific, benefit-focused copy outperforms generic every time." },
              ].map(({ test, why }) => (
                <div key={test} className="flex gap-4 bg-surface-dark border border-white/8 rounded-lg p-4">
                  <span className="font-display font-semibold text-white/90 text-sm w-32 flex-shrink-0">{test}</span>
                  <p className="text-white/55 text-sm">{why}</p>
                </div>
              ))}
            </div>

            <h3>Sample size reality check</h3>
            <p>
              Tests under 500 subscribers per variant produce noise, not signal. A 5% open rate difference on a 200-person test could easily be random. If your list isn't big enough for clean A/B tests yet, run the same variation across multiple sends and look for consistent patterns rather than treating any single send as a data point.
            </p>
          </section>

          {/* Benchmarks */}
          <section id="benchmarks">
            <h2>Industry Benchmarks (2025)</h2>
            <p>
              Use these as calibration, not as targets. A 500-subscriber niche newsletter with 55% open rates is healthier than a 50,000-subscriber list sitting at 8%. The numbers below come from Mailchimp's 2025 Email Marketing Benchmarks report.
            </p>

            <div className="overflow-x-auto my-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-3 text-white/50 font-medium">Industry</th>
                    <th className="text-right py-3 px-3 text-white/50 font-medium">Open Rate</th>
                    <th className="text-right py-3 px-3 text-white/50 font-medium">Click Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {industryBenchmarks.map((row, i) => (
                    <tr
                      key={row.industry}
                      className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/2' : ''}`}
                    >
                      <td className="py-3 px-3 text-white/70">{row.industry}</td>
                      <td className="py-3 px-3 text-right font-mono text-white/80">{row.open}</td>
                      <td className="py-3 px-3 text-right font-mono text-white/80">{row.ctr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>Quick health check</h3>
            <div className="grid sm:grid-cols-3 gap-4 my-5">
              {[
                { metric: 'Open Rate', healthy: '> 20%', great: '> 35%', note: 'Under 15% is a signal — deliverability or content problem' },
                { metric: 'Click Rate', healthy: '> 2%', great: '> 5%', note: 'High opens + low clicks usually means weak or missing CTA' },
                { metric: 'Unsubscribe Rate', healthy: '< 0.5%', great: '< 0.2%', note: 'Spike above 1% per send means something didn\'t land' },
              ].map(m => (
                <div key={m.metric} className="stat-card">
                  <div className="font-display font-semibold text-white mb-2 text-sm">{m.metric}</div>
                  <div className="text-xs text-white/50 mb-1">Healthy: <span className="text-emerald-400">{m.healthy}</span></div>
                  <div className="text-xs text-white/50 mb-2">Great: <span className="text-primary">{m.great}</span></div>
                  <div className="text-xs text-white/40 italic">{m.note}</div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2>Questions we get a lot</h2>
            <div className="space-y-2">
              {faqs.map(f => <Faq key={f.q} {...f} />)}
            </div>
          </section>

          <div className="tip-card mt-10">
            <div className="text-sm font-semibold text-primary mb-2">Apply this right now</div>
            <p className="text-white/65 text-sm mb-4">
              Score your next subject line before you send it, or check your character count across every platform at once — both free, no login needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/free-tools" className="btn-primary text-sm">Free Tools</Link>
              <a href="https://app.newsletterwizard.io" className="btn-ghost text-sm">Try Newsletter Wizard</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
