import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, ArrowRight, Clock, Hash, Image, Video, MessageCircle, TrendingUp, Users } from 'lucide-react'

type Platform = 'twitter' | 'linkedin' | 'instagram' | 'tiktok' | 'facebook' | 'youtube'

const platforms: { id: Platform; label: string; color: string }[] = [
  { id: 'twitter', label: 'Twitter / X', color: 'from-sky-600/20 to-sky-600/5' },
  { id: 'linkedin', label: 'LinkedIn', color: 'from-blue-700/20 to-blue-700/5' },
  { id: 'instagram', label: 'Instagram', color: 'from-pink-600/20 to-pink-600/5' },
  { id: 'tiktok', label: 'TikTok', color: 'from-rose-500/20 to-rose-500/5' },
  { id: 'facebook', label: 'Facebook', color: 'from-blue-600/20 to-blue-600/5' },
  { id: 'youtube', label: 'YouTube', color: 'from-red-600/20 to-red-600/5' },
]

function StatRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-white/50 text-sm">{label}</span>
      <div className="text-right">
        <span className="text-white/90 font-mono text-sm font-medium">{value}</span>
        {note && <div className="text-white/35 text-xs mt-0.5">{note}</div>}
      </div>
    </div>
  )
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-white/65 text-sm">
      <CheckCircle2 className="w-3.5 h-3.5 text-primary/70 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </li>
  )
}

function WarnItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-white/65 text-sm">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400/80 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </li>
  )
}

const platformContent: Record<Platform, JSX.Element> = {
  twitter: (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-white mb-1">Twitter / X</h2>
        <p className="text-white/50 text-sm">The text-first platform where ideas spread fastest — if you actually understand how distribution works here.</p>
      </div>

      <div className="bg-surface-dark border border-white/8 rounded-xl p-5">
        <h3 className="font-display font-semibold text-white/90 text-sm mb-3">Character limits</h3>
        <StatRow label="Single tweet" value="280 characters" note="Sweet spot: 100–200 for engagement" />
        <StatRow label="Thread posts" value="280 each" note="No official thread limit" />
        <StatRow label="Alt text" value="1,000 characters" />
        <StatRow label="Username" value="15 characters" />
        <StatRow label="Bio" value="160 characters" />
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-sky-400" /> How the algorithm actually works</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-4">
          X open-sourced part of their ranking algorithm, which gave everyone a look at how content actually gets distributed. The short version: replies are weighted roughly 27 times more than likes. The platform is pushing for conversations, not passive scrolling. Engagement rate matters more than follower count — 500 followers where 10% of them engage beats 50,000 followers where 0.1% do.
        </p>
        <p className="text-white/60 text-sm leading-relaxed mb-4">
          One thing a lot of people get wrong: external links get suppressed in the feed. Put links in the first reply, not the post body. It's counterintuitive but the difference in reach is significant.
        </p>
        <ul className="space-y-2">
          <CheckItem>Replies beat retweets beat likes — write posts that make people want to respond.</CheckItem>
          <CheckItem>Images increase engagement about 3x vs text-only (Buffer, 2024).</CheckItem>
          <CheckItem>Threads distribute more broadly than single tweets. Use them for anything with depth.</CheckItem>
          <CheckItem>Don't put links in the post. Put them in the reply thread — your reach will thank you.</CheckItem>
          <CheckItem>1–3 posts a day outperforms one burst per week, even if the individual posts are similar quality.</CheckItem>
        </ul>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-sky-400" /> When to post</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { time: '8–10 AM', day: 'Weekdays', note: 'Morning scroll at desk or commute' },
            { time: '12–1 PM', day: 'Weekdays', note: 'Lunch break' },
            { time: '5–7 PM', day: 'Weekdays', note: 'Commute home, winding down' },
          ].map(t => (
            <div key={t.time} className="bg-surface-dark border border-white/8 rounded-lg p-4 text-center">
              <div className="font-display font-semibold text-white">{t.time}</div>
              <div className="text-white/50 text-xs mt-1">{t.day}</div>
              <div className="text-white/35 text-xs mt-1">{t.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2"><Hash className="w-4 h-4 text-sky-400" /> Hashtags</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-3">
          One or two. That's it. X's own research shows that posts with more than two hashtags actually see lower engagement — not because readers hate them, but because the algorithm reads hashtag overuse as a spam signal. The algorithm understands context well enough without tags. Use them only when a tag has a real active community (#buildinpublic, #fintech, specific industry terms) — not as keyword stuffing at the end of every tweet.
        </p>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3">How to write a thread that gets traction</h3>
        <div className="space-y-3">
          {[
            { n: '1', tip: "Your first tweet is 80% of the thread's performance. A bold claim, the start of a story, a number that surprises — something that makes people stop scrolling. 'Here are 7 things I learned' is not a hook. 'I spent $40k to learn this one thing' is." },
            { n: '2–8', tip: "Each tweet should give the reader something they didn't have before. Don't pad. If a tweet doesn't add a new idea, cut it. Readers can feel filler." },
            { n: 'Last', tip: "End with something — a question, a CTA, a link to your newsletter. Threads that just stop are a missed opportunity. The people who read to the end are your most engaged readers." },
          ].map(s => (
            <div key={s.n} className="flex gap-4 bg-surface-dark/60 border border-white/6 rounded-lg p-4">
              <div className="w-8 h-8 rounded-full bg-sky-600/20 border border-sky-600/30 flex items-center justify-center text-xs font-mono text-sky-400 flex-shrink-0">{s.n}</div>
              <p className="text-white/60 text-sm leading-relaxed">{s.tip}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3">What actually hurts you here</h3>
        <ul className="space-y-2">
          <WarnItem>Cross-posting from Instagram — square image, cropped caption, hashtag wall. It looks like you don't actually use Twitter and the algorithm agrees.</WarnItem>
          <WarnItem>Link in the post body. We said it above but it's worth repeating — this is probably the most common avoidable reach killer.</WarnItem>
          <WarnItem>Chasing viral with content that doesn't fit your brand. The followers you get from off-brand posts don't convert to newsletter subscribers.</WarnItem>
          <WarnItem>Only replying to big accounts hoping for spillover attention. It works occasionally but it's not a strategy.</WarnItem>
        </ul>
      </div>
    </div>
  ),

  linkedin: (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-white mb-1">LinkedIn</h2>
        <p className="text-white/50 text-sm">The highest organic reach of any major platform for professional content — if you can stop writing like a press release.</p>
      </div>

      <div className="bg-surface-dark border border-white/8 rounded-xl p-5">
        <h3 className="font-display font-semibold text-white/90 text-sm mb-3">Character limits</h3>
        <StatRow label="Post body" value="3,000 characters" note="Sweet spot: 900–1,200 for long-form" />
        <StatRow label="Visible before 'See more'" value="~210 characters" note="The most important real estate" />
        <StatRow label="Headline" value="220 characters" />
        <StatRow label="About section" value="2,600 characters" />
        <StatRow label="Article" value="125,000 characters" />
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-400" /> How distribution works</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-4">
          LinkedIn doesn't show your post to everyone at once. It tests it on a small slice of your network first. If that group engages, reach expands. If it doesn't, the post dies. Early engagement — in the first hour — matters a lot. This is why posting when you can actually respond to comments is important. Each reply you write is a new engagement signal.
        </p>
        <p className="text-white/60 text-sm leading-relaxed mb-4">
          Personal accounts get somewhere between 5 and 10 times more organic reach than company pages. Post as yourself. Use your company page for reposts and official announcements — not for your primary content distribution.
        </p>
        <p className="text-white/60 text-sm leading-relaxed mb-4">
          And don't put links in your post. LinkedIn actively reduces distribution for link posts — they want people to stay on the platform. Put the URL in the first comment. It's a small workaround that makes a noticeable difference.
        </p>
        <ul className="space-y-2">
          <CheckItem>The first three lines before "See more" are the whole game. Start with the hook, not the context.</CheckItem>
          <CheckItem>Document carousels (PDF slides) generate 3–5x more reach than text-only posts. They're the most underused format on the platform.</CheckItem>
          <CheckItem>Respond to all comments in the first two hours. Every response is a fresh engagement signal.</CheckItem>
          <CheckItem>Native video with captions works well. Upload directly — don't link to YouTube.</CheckItem>
        </ul>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400" /> When to post</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { time: 'Tue–Thu', window: '8–10 AM', note: 'Desk arrival, catching up' },
            { time: 'Tue–Thu', window: '12–1 PM', note: 'Lunch break' },
            { time: 'Avoid', window: 'Weekends', note: 'Professional context drops sharply' },
          ].map(t => (
            <div key={t.window + t.time} className="bg-surface-dark border border-white/8 rounded-lg p-4 text-center">
              <div className="font-display font-semibold text-white">{t.window}</div>
              <div className="text-white/50 text-xs mt-1">{t.time}</div>
              <div className="text-white/35 text-xs mt-1">{t.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3">Formats that actually get reach</h3>
        <div className="space-y-3">
          {[
            { format: 'Document carousel', desc: 'Upload a PDF as a document post. Each slide is a swipe. High dwell time reads as strong engagement to the algorithm. Frameworks, step-by-step breakdowns, data visuals — anything that works as a sequence of slides.' },
            { format: 'Personal story + lesson', desc: "Personal stories with a professional takeaway consistently outperform polished thought leadership. 'I made a mistake that cost us $40k — here's what I learned' beats 'Three lessons from Q4' every time. Authenticity isn't a soft skill on LinkedIn, it's a distribution advantage." },
            { format: 'Native video with captions', desc: "Auto-plays muted in the feed. First frame has to work without sound. Add captions (most editing apps do this automatically now). 1–3 minutes for educational content is the sweet spot." },
            { format: 'Line-break text posts', desc: "LinkedIn's feed treats blank lines as breathing room. Each point gets its own line or two. Dense paragraphs get scrolled past. This isn't stylistic — it's a readability decision that affects how far people get through your post." },
          ].map(f => (
            <div key={f.format} className="flex gap-4 bg-surface-dark/60 border border-white/6 rounded-xl p-4">
              <div className="font-display font-semibold text-white/90 text-sm w-36 flex-shrink-0">{f.format}</div>
              <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2"><Hash className="w-4 h-4 text-blue-400" /> Hashtags</h3>
        <p className="text-white/60 text-sm leading-relaxed">
          Three to five, placed at the end of the post. Mix one or two large tags (500k+ followers) with two or three niche ones (10k–50k). LinkedIn uses hashtags for content categorization — they actually matter here for discovery, unlike on some other platforms. But stuffing 15 at the end looks like desperation and doesn't help.
        </p>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3">What kills your reach</h3>
        <ul className="space-y-2">
          <WarnItem>Posting company announcements and product updates. Nobody engages with corporate speak. If your post could have been a press release, it probably shouldn't be a LinkedIn post.</WarnItem>
          <WarnItem>Links in the post body. We know we keep saying this but it's consistently the most avoidable mistake.</WarnItem>
          <WarnItem>Ignoring comments for more than a few hours. The algorithm scores that post as low-engagement and stops showing it.</WarnItem>
          <WarnItem>Motivational quote posts. They get likes from people who aren't your audience and do nothing for your actual reach with the people you care about.</WarnItem>
        </ul>
      </div>
    </div>
  ),

  instagram: (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-white mb-1">Instagram</h2>
        <p className="text-white/50 text-sm">Visual-first, with Reels doing most of the discovery work right now. Feed posts are for your existing audience. Reels are how new people find you.</p>
      </div>

      <div className="bg-surface-dark border border-white/8 rounded-xl p-5">
        <h3 className="font-display font-semibold text-white/90 text-sm mb-3">Character limits & specs</h3>
        <StatRow label="Caption" value="2,200 characters" note="First 125 visible in feed before 'more'" />
        <StatRow label="Bio" value="150 characters" />
        <StatRow label="Username" value="30 characters" />
        <StatRow label="Hashtags per post" value="30 max" note="Sweet spot is 5–10" />
        <StatRow label="Story text" value="2,200 characters" />
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2"><Video className="w-4 h-4 text-pink-400" /> Reels vs Feed vs Stories — what each one actually does</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              format: 'Reels',
              purpose: 'Discovery — new followers',
              reach: 'Shown to non-followers',
              tip: "Hook in the first 2–3 seconds — no intros, no 'hey everyone.' Native audio outperforms uploaded video. 15–30 seconds for mass reach; up to 60 for educational content that people actually stay for.",
              color: 'border-pink-500/30',
            },
            {
              format: 'Feed Posts',
              purpose: 'Depth with existing audience',
              reach: 'Mostly your followers',
              tip: "Carousels get the most saves and shares of any feed format. Save rate is the strongest engagement signal for feed distribution. If someone saves your post, the algorithm pays attention.",
              color: 'border-violet-500/30',
            },
            {
              format: 'Stories',
              purpose: 'Daily relationship building',
              reach: 'Followers only',
              tip: "Polls, questions, quizzes — anything that makes someone tap. Responses signal active engagement. Post 3–7 stories a day if you can. It builds the habit of your audience checking your profile.",
              color: 'border-purple-500/30',
            },
          ].map(f => (
            <div key={f.format} className={`bg-surface-dark border ${f.color} rounded-xl p-4`}>
              <div className="font-display font-semibold text-white text-sm mb-1">{f.format}</div>
              <div className="text-white/40 text-xs mb-2">{f.purpose}</div>
              <div className="text-xs text-white/55 mb-3"><span className="text-white/40">Reach: </span>{f.reach}</div>
              <p className="text-white/60 text-xs leading-relaxed">{f.tip}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-pink-400" /> When to post</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-3">
          For feed posts: <strong className="text-white/90">11 AM–1 PM</strong> and <strong className="text-white/90">7–9 PM</strong> in your audience's timezone. For Reels — timing matters less. The algorithm distributes based on engagement signals over time, not just recency. That said, posting during peak hours gives your Reel better initial velocity, which helps it get picked up faster.
        </p>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2"><Hash className="w-4 h-4 text-pink-400" /> Hashtags in 2026</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-3">
          The "30 hashtag" strategy is dead. Instagram's own recommendation is now 3–5 targeted hashtags. Overloading gets you flagged as spam. The algorithm understands what your post is about from context — you're not gaming the categorization system by stuffing 30 tags anymore.
        </p>
        <ul className="space-y-2">
          <CheckItem>1–2 large tags (1M+ posts) — you'll be in a crowded feed but the audience is huge.</CheckItem>
          <CheckItem>2–3 mid tags (50k–500k posts) — better odds of showing up in top posts for the tag.</CheckItem>
          <CheckItem>1–2 niche tags (under 50k) — smaller pool but highly relevant people.</CheckItem>
        </ul>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3"><Image className="w-4 h-4 text-pink-400 inline mr-2" />Writing captions</h3>
        <p className="text-white/60 text-sm leading-relaxed">
          Those first 125 characters are everything — they're the only thing visible before "more." Treat them exactly like a subject line. The rest of your caption depends on people tapping through. End with a question or direct CTA. Comments and saves outweigh likes for feed algorithm distribution — "save this for later" in your caption can literally double your save rate.
        </p>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3">Mistakes that cost you</h3>
        <ul className="space-y-2">
          <WarnItem>Posting Reels with a TikTok watermark. Instagram actively suppresses these. Save the original without the watermark — apps like SnapTik do this for free.</WarnItem>
          <WarnItem>Posting only when you feel inspired. The algorithm doesn't care about your inspiration — it cares about consistency.</WarnItem>
          <WarnItem>Captions with no CTA. "Save this for later" is worth writing. People need the prompt.</WarnItem>
          <WarnItem>Nothing but product posts. If every post is promotional, people unfollow. The ratio should tilt heavily toward value.</WarnItem>
        </ul>
      </div>
    </div>
  ),

  tiktok: (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-white mb-1">TikTok</h2>
        <p className="text-white/50 text-sm">The most powerful discovery algorithm of any platform. Zero followers needed to reach thousands of people — but your first three seconds will make or break the whole video.</p>
      </div>

      <div className="bg-surface-dark border border-white/8 rounded-xl p-5">
        <h3 className="font-display font-semibold text-white/90 text-sm mb-3">Format & limits</h3>
        <StatRow label="Caption" value="2,200 characters" note="First 100 visible in feed" />
        <StatRow label="Video length" value="Up to 10 minutes" note="15–60s gets widest distribution" />
        <StatRow label="Bio" value="80 characters" />
        <StatRow label="Hashtags" value="No hard limit" note="Use 3–5" />
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-rose-400" /> How TikTok actually distributes content</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-4">
          Every video gets tested on a small audience regardless of follower count. If that group watches to completion and engages, TikTok pushes it to a larger audience. Keep going well and it gets pushed again. The metrics that matter most: completion rate (did they watch all the way through?), rewatch rate (did they play it again?), and shares (did they send it to someone?).
        </p>
        <p className="text-white/60 text-sm leading-relaxed mb-4">
          This is why a 30-second video watched 100% beats a 3-minute video watched 10% — even though the longer one has more total watch time. The algorithm cares about proportion, not duration.
        </p>
        <ul className="space-y-2">
          <CheckItem>Your first 3 seconds have to create a "wait, what?" reaction. No intros. No "hey guys." Jump in.</CheckItem>
          <CheckItem>Completion rate is the most important signal. Short videos that get watched fully beat long videos that get dropped.</CheckItem>
          <CheckItem>Trending sounds boost discoverability — TikTok's search indexes audio, not just topic.</CheckItem>
          <CheckItem>Text overlays increase retention for educational content by giving people something to track.</CheckItem>
          <CheckItem>Post 1–3 times daily if you're in a growth phase. Frequency is how the algorithm builds a model of your content.</CheckItem>
        </ul>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-rose-400" /> When to post</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { time: '6–9 AM', day: 'Weekdays', note: 'Morning scroll before work' },
            { time: '7–10 PM', day: 'Any day', note: 'Peak evening browsing' },
            { time: '12–3 PM', day: 'Weekends', note: 'Mid-day leisure' },
          ].map(t => (
            <div key={t.time} className="bg-surface-dark border border-white/8 rounded-lg p-4">
              <div className="font-display font-semibold text-white text-sm">{t.time}</div>
              <div className="text-white/50 text-xs">{t.day} — {t.note}</div>
            </div>
          ))}
        </div>
        <p className="text-white/40 text-xs mt-3">Timing matters less here than on other platforms — the FYP is not primarily chronological. Good content gets distributed days later.</p>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3">Hook formulas that work</h3>
        <div className="space-y-2">
          {[
            '"I spent $10k learning this so you don\'t have to"',
            '"This mistake cost me [X] — watch before you make it"',
            '"Nobody talks about this but [counterintuitive thing]"',
            '"Stop doing [common habit]. Do this instead."',
            '"[Number] things I wish I knew before [experience]"',
          ].map(h => (
            <div key={h} className="bg-rose-500/5 border border-rose-500/20 rounded-lg px-4 py-2.5 text-white/70 text-sm italic">{h}</div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3">What kills performance</h3>
        <ul className="space-y-2">
          <WarnItem>Slow intros. "Hey everyone, today I'm going to talk about..." — completion rate drops immediately. The algorithm moves on.</WarnItem>
          <WarnItem>Deleting low-performing videos. Each post is an independent test. Removing them doesn't help your account metrics.</WarnItem>
          <WarnItem>Horizontal video. TikTok is 9:16 vertical. Horizontal gets a smaller display and looks like you uploaded the wrong file.</WarnItem>
          <WarnItem>Posting only when you have something "important." On TikTok, frequency is a growth signal. You're not diluting your brand by posting daily — you're training the algorithm.</WarnItem>
        </ul>
      </div>
    </div>
  ),

  facebook: (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-white mb-1">Facebook</h2>
        <p className="text-white/50 text-sm">Pages are mostly dead for organic reach. But Facebook Groups, Reels, and personal profiles are still genuinely valuable — especially for community-driven publishers.</p>
      </div>

      <div className="bg-surface-dark border border-white/8 rounded-xl p-5">
        <h3 className="font-display font-semibold text-white/90 text-sm mb-3">Character limits</h3>
        <StatRow label="Status / post" value="63,206 characters" note="Optimal: 40–80 for highest engagement" />
        <StatRow label="Page name" value="75 characters" />
        <StatRow label="Group description" value="3,000 characters" />
        <StatRow label="Event description" value="64,000 characters" />
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> The organic reach reality</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-3">
          Facebook Page organic reach sits at 2–5% of your followers. This is by design — Facebook monetizes reach through ads. If you're counting on a Page for distribution, you need a different strategy, because that math doesn't work.
        </p>
        <p className="text-white/60 text-sm leading-relaxed mb-3">
          What still has real organic reach on Facebook:
        </p>
        <ul className="space-y-2">
          <CheckItem>Facebook Groups — members get notifications and see posts in a dedicated feed, not the general algorithmic mess.</CheckItem>
          <CheckItem>Facebook Reels — the algorithm distributes these to non-followers, same playbook as TikTok/Instagram Reels.</CheckItem>
          <CheckItem>Personal profiles — friend posts still get around 25% reach versus a Page's 2–5%.</CheckItem>
          <CheckItem>Events — attendee updates still reach people directly.</CheckItem>
        </ul>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-blue-400" /> The Groups strategy</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-3">
          For newsletter publishers, a Facebook Group almost always outperforms a Page. Members opted in, they receive notifications, they engage in discussions. Your newsletter content becomes conversation prompts. Group members convert to email subscribers at higher rates than cold traffic — they're already your audience, they just need the next step.
        </p>
        <ul className="space-y-2">
          <CheckItem>Post content that generates discussion, not just consumption — questions, polls, debates about your niche topic.</CheckItem>
          <CheckItem>Weekly prompts ("What are you working on?") build routine and daily active users.</CheckItem>
          <CheckItem>Members-only exclusive content gives people a reason to stay and invite others.</CheckItem>
          <CheckItem>Pin your newsletter signup in the group description and welcome post. You've already earned the trust — ask for the email.</CheckItem>
        </ul>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400" /> When to post</h3>
        <p className="text-white/60 text-sm leading-relaxed">
          For Pages (if you're still using them): <strong className="text-white/90">Wednesday 11 AM–1 PM</strong> and <strong className="text-white/90">Thursday 1–2 PM</strong> consistently show up as top performers across industries. For Groups: early morning (7–9 AM) and evening (7–9 PM) when people are browsing recreationally. Saturday mornings are weak. Late Sunday night is a no.
        </p>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3">What doesn't work</h3>
        <ul className="space-y-2">
          <WarnItem>Treating a Facebook Page like it has organic reach. It doesn't. Stop expecting it to.</WarnItem>
          <WarnItem>Cross-posting identical content from Instagram — different platform, different context, different expectations. Readers can tell.</WarnItem>
          <WarnItem>Long posts without line breaks. Facebook compresses dense text. One thought per paragraph.</WarnItem>
          <WarnItem>External links without context. Facebook suppresses these more aggressively than almost any other platform.</WarnItem>
        </ul>
      </div>
    </div>
  ),

  youtube: (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-white mb-1">YouTube Community Posts</h2>
        <p className="text-white/50 text-sm">The most underused tool in YouTube. Community posts live in your subscribers' feed — they keep you visible between uploads without requiring a full production.</p>
      </div>

      <div className="bg-surface-dark border border-white/8 rounded-xl p-5">
        <h3 className="font-display font-semibold text-white/90 text-sm mb-3">Format & limits</h3>
        <StatRow label="Post text" value="No hard limit" note="Under 300 characters performs best" />
        <StatRow label="Image posts" value="1 image or carousel up to 5" />
        <StatRow label="Poll options" value="Up to 5" />
        <StatRow label="Eligibility" value="500+ subscribers" note="Or apply for early access" />
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-red-400" /> Why this matters for newsletter publishers</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-4">
          Community posts appear in subscribers' home feeds and trigger bell notifications. For newsletter publishers specifically, they bridge the gap between video uploads and keep your audience warm — which means better view velocity when you do post a video, and a warmer audience to invite to your list.
        </p>
        <p className="text-white/60 text-sm leading-relaxed mb-4">
          Most creators post 0–1 community posts per week. Posting 3–5 is a real differentiation. It's not saturated the way other content formats are.
        </p>
        <ul className="space-y-2">
          <CheckItem>Polls get 3–5x more engagement than text posts. Use them weekly — they take 30 seconds to make.</CheckItem>
          <CheckItem>Behind-the-scenes images build parasocial connection between uploads.</CheckItem>
          <CheckItem>Teasing upcoming content in a community post increases view velocity on launch day.</CheckItem>
          <CheckItem>Questions generate comments, which surface you in the algorithm and give you real audience research at the same time.</CheckItem>
        </ul>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3">Post formats that work</h3>
        <div className="space-y-2">
          {[
            { type: 'Poll', example: '"Which topic should I cover next — A or B?" — makes subscribers feel like they shaped the content.' },
            { type: 'Sneak peek', example: 'A screenshot or image from the next video with one teaser sentence. Builds anticipation without giving it away.' },
            { type: 'Newsletter plug', example: '"I\'m writing something in this week\'s newsletter that won\'t fit in a video. Link in bio." Works better than a generic CTA.' },
            { type: 'Open question', example: '"What\'s the biggest thing you\'re struggling with around [niche topic]?" — audience research you don\'t have to pay for.' },
            { type: 'Milestone', example: '"Just hit [X] subscribers. Here\'s what\'s coming next." — shows momentum, creates social proof.' },
          ].map(p => (
            <div key={p.type} className="flex gap-4 bg-surface-dark/60 border border-white/6 rounded-xl p-4">
              <span className="font-display font-semibold text-white/90 text-sm w-28 flex-shrink-0">{p.type}</span>
              <p className="text-white/60 text-sm leading-relaxed">{p.example}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-red-400" /> Frequency and timing</h3>
        <p className="text-white/60 text-sm leading-relaxed">
          Two to five community posts per week is the target. This sounds like a lot — most creators post zero or one — which is exactly why it's worth doing. Timing: check your YouTube Analytics under Audience → "When your viewers are on YouTube" for your specific channel. That beats any generic recommendation.
        </p>
      </div>
    </div>
  ),
}

export default function SocialMediaPage() {
  const [active, setActive] = useState<Platform>('twitter')

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/30 rounded-full px-3 py-1 text-xs text-violet-300 font-medium mb-4">
          6 platforms — Updated 2026
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
          Social Media by Platform
        </h1>
        <p className="text-xl text-white/55 max-w-2xl leading-relaxed">
          Each platform plays by different rules. What works on LinkedIn will tank on TikTok. Here's what you need to know about each one — format, algorithm, timing, and the mistakes that actually hurt you.
        </p>
      </div>

      {/* Platform tabs */}
      <div className="flex flex-wrap gap-2 mb-8 p-1 bg-surface-dark/50 border border-white/6 rounded-xl">
        {platforms.map(p => (
          <button
            key={p.id}
            className={`platform-tab flex-1 min-w-[100px] ${active === p.id ? 'active' : ''}`}
            onClick={() => setActive(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className={`bg-gradient-to-b ${platforms.find(p => p.id === active)!.color} border border-white/8 rounded-2xl p-6 md:p-8`}>
        {platformContent[active]}
      </div>

      {/* Cross-platform */}
      <div className="mt-10 bg-surface-dark border border-white/8 rounded-2xl p-6">
        <h2 className="font-display text-xl font-bold text-white mb-2">Things that hold across all of them</h2>
        <p className="text-white/45 text-xs mb-5">Regardless of which platform you're on, these patterns keep showing up.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { tip: 'Native content always wins', desc: "Every platform rewards content made for it and suppresses content that sends users somewhere else. Post video natively. Keep people on the platform. This isn't optional — it's how distribution works." },
            { tip: 'Consistency beats perfection', desc: "A steady schedule trains both the algorithm and your audience. Showing up predictably on Tuesday outperforms dropping something brilliant once a month and going quiet." },
            { tip: 'Platform context is real', desc: "The same message rewritten for LinkedIn, TikTok, and Twitter should feel native to each. Copy-pasting between platforms is always visible to the people who use both." },
            { tip: 'Repurpose, don\'t recycle', desc: "A newsletter becomes a LinkedIn carousel, a Twitter thread, a TikTok script, an Instagram caption — but each one adapted to how that platform communicates, not just cropped." },
            { tip: 'Your goal is always the email list', desc: "Every platform rents you access to your audience. The strategy on social is to move your most engaged readers to a list you actually own." },
            { tip: 'First hour engagement matters everywhere', desc: "All major platforms use early engagement velocity to decide how widely to distribute. Post when you can actually respond to comments for the first hour." },
          ].map(({ tip, desc }) => (
            <div key={tip} className="flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-primary/70 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-white/90 text-sm">{tip}</div>
                <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 tip-card">
        <div className="text-sm font-semibold text-primary mb-2">Check your character counts before you post</div>
        <p className="text-white/65 text-sm mb-4">
          The free character counter shows your count against every platform limit at once. Or let Newsletter Wizard generate platform-adapted social posts from your newsletter automatically.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/free-tools" className="btn-primary text-sm">Character Counter</Link>
          <a href="https://app.newsletterwizard.io" className="btn-ghost text-sm">Try Newsletter Wizard <ArrowRight className="inline w-3.5 h-3.5 ml-1" /></a>
        </div>
      </div>
    </div>
  )
}
