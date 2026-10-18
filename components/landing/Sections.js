// The landing page sections, top to bottom. Layout and visual language follow the Conicorn
// reference (floating nav, dark hero fading into soft greys, numbered section tags, very round
// "pressed" cards, iridescent accents); all content is about Blast Radius and every number comes
// from lib/landing-data.js.
import Logo from '@/components/Logo';
import AsciiShockwave from './AsciiShockwave';
import AgentPreview from './AgentPreview';
import ExampleCarousel from './ExampleCarousel';
import ProcessTimeline from './ProcessTimeline';
import Reveal from './Reveal';
import { RiseWords, ScrollRevealText, ScrollTilt } from './motion';
import { Button, GITHUB_URL, Marquee, SectionTag } from './ui';

const CONTAINER = 'mx-auto w-full max-w-[1280px] px-5 sm:px-10 lg:px-20';
const H2 = 'text-center text-[40px] font-medium leading-[1.1] tracking-[-0.05em] text-ink sm:text-5xl lg:text-[72px]';
const LEAD = 'max-w-[640px] text-center text-base leading-[1.35] tracking-[-0.03em] text-muted lg:text-lg';

function SectionHeader({ num, tag, title, sub }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <Reveal><SectionTag num={num}>{tag}</SectionTag></Reveal>
      <div className="flex flex-col items-center gap-4">
        <RiseWords text={title} className={H2} />
        {sub && <Reveal delay={150}><p className={LEAD}>{sub}</p></Reveal>}
      </div>
    </div>
  );
}

const svgIcon = (d, cls = 'h-6 w-6') => (
  <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

/* ─── Hero ─────────────────────────────────────────────────────────────────────────────────── */

export function Hero({ serviceNames }) {
  const rise = (ms) => ({ animationDelay: `${ms}ms` });
  return (
    <section className="relative overflow-hidden bg-ink" aria-labelledby="hero-title">
      {/* Background: the ASCII shockwave, a soft iridescent glow and a darkening veil */}
      <AsciiShockwave className="text-white/[0.16]" />
      <div className="pointer-events-none absolute left-1/2 top-[58%] h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-iridescent-radial opacity-25 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.45),rgb(0_0_0/0.05)_97%)]" />

      <div className={`${CONTAINER} relative flex min-h-[720px] flex-col items-center justify-center pb-16 pt-36 sm:min-h-dvh`}>
        <p
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[-0.03em] text-white motion-safe:animate-rise"
          style={rise(900)}
        >
          {svgIcon(<path d="M12 3c.6 3.9 2.1 5.4 6 6-3.9.6-5.4 2.1-6 6-.6-3.9-2.1-5.4-6-6 3.9-.6 5.4-2.1 6-6Z" fill="currentColor" stroke="none" />, 'h-4 w-4')}
          AI incident agent · FalkorDB
        </p>
        <h1
          id="hero-title"
          className="max-w-[16ch] bg-iridescent bg-clip-text pb-2 text-center text-5xl font-semibold leading-none tracking-[-0.06em] text-transparent sm:text-[64px] lg:text-[80px] motion-safe:animate-rise"
          style={rise(150)}
        >
          Know what breaks <br className="hidden sm:block" />before it breaks.
        </h1>
        <p className="mt-6 max-w-[640px] text-center text-base leading-[1.35] tracking-[-0.03em] text-white/85 lg:text-lg motion-safe:animate-rise" style={rise(400)}>
          Ask what happens if a service goes down. Blast Radius walks your dependency graph, ranks the impact by tier and
          tells you which teams to call, with every query it ran attached.
        </p>
        <div className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-2">
          <span className="motion-safe:animate-rise" style={rise(600)}><Button href="/agent">Open the agent</Button></span>
          <span className="motion-safe:animate-rise" style={rise(750)}><Button href={GITHUB_URL} variant="glass">View on GitHub</Button></span>
        </div>
      </div>

      {/* Bottom strip: every service in the demo graph, fading into the next section */}
      <div className="relative bg-[linear-gradient(180deg,transparent,#b7b7b7)] pb-6 pt-8">
        <p className="sr-only">The demo graph contains {serviceNames.length} services.</p>
        <Marquee duration={70} gap={56} className="h-8">
          {serviceNames.map((n) => (
            <span key={n} className="flex items-center gap-2 whitespace-nowrap font-mono text-sm text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />{n}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

/* ─── 001 What it is ───────────────────────────────────────────────────────────────────────── */

export function About({ preview, stats }) {
  const facts = [
    [stats.services, 'services'],
    [stats.dependencies, 'dependencies'],
    [stats.incidents, 'past incidents'],
    [stats.tools, 'graph tools'],
    [stats.teams, 'teams'],
  ];
  return (
    <section id="about" className="scroll-mt-24 bg-[linear-gradient(180deg,#b7b7b7,#fff)] py-16 sm:py-24 lg:py-[120px]">
      <div className={`${CONTAINER} flex flex-col items-center gap-16 lg:gap-[120px]`}>
        <div className="flex max-w-[1000px] flex-col items-center gap-6">
          <Reveal><SectionTag num="001">what it is</SectionTag></Reveal>
          <ScrollRevealText
            className="text-center text-[28px] font-normal leading-[1.1] tracking-[-0.04em] sm:text-4xl lg:text-5xl"
            text="Blast Radius is an AI agent for the first minutes of an incident. It reads a graph of your services, teams, engineers and past outages, follows the dependencies, and answers only with facts it can prove."
          />
        </div>
        <div className="w-full max-w-[1120px]">
          <ScrollTilt>
            <AgentPreview {...preview} />
          </ScrollTilt>
          <p className="mt-5 text-center text-sm tracking-[-0.03em] text-muted">
            A replay of the agent&apos;s real answer on the seeded demo graph. The live agent runs the same tools against FalkorDB.
          </p>
        </div>
      </div>
      <Marquee duration={45} gap={120} className="mt-16 lg:mt-24">
        {facts.map(([n, label]) => (
          <span key={label} className="flex items-baseline gap-4 whitespace-nowrap text-6xl font-semibold uppercase leading-none tracking-[-0.08em] sm:text-8xl lg:text-[114px]">
            <span className="text-black">{n}</span><span className="text-faint">{label}</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}

/* ─── 002 Why a graph ──────────────────────────────────────────────────────────────────────── */

const VALUES = [
  {
    title: 'Facts, not guesses',
    text: 'Every name, owner and count comes from a graph query. The agent is told never to guess.',
    icon: svgIcon(<><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="7" r="2.5" /><circle cx="12" cy="18" r="2.5" /><path d="M8 7.2 15.6 7M7.2 8.2l3.6 7.6M17 9.2l-3.8 6.9" /></>, 'h-10 w-10'),
  },
  {
    title: 'Multi-hop by nature',
    text: 'Outages spread through chains of dependencies. One graph query follows them three hops out.',
    icon: svgIcon(<><circle cx="12" cy="12" r="2.5" /><circle cx="12" cy="12" r="6" opacity=".6" /><circle cx="12" cy="12" r="9.5" opacity=".35" /></>, 'h-10 w-10'),
  },
  {
    title: 'Proof you can check',
    text: 'Each answer lists the tools it ran, their inputs and the exact Cypher, so you can verify it.',
    icon: svgIcon(<><path d="M12 3 4.5 6v5.5c0 4.3 3.1 8.1 7.5 9.5 4.4-1.4 7.5-5.2 7.5-9.5V6Z" /><path d="m8.5 12 2.5 2.5 4.5-4.5" /></>, 'h-10 w-10'),
  },
];

export function Value() {
  return (
    <section id="value" className="scroll-mt-24 py-16 sm:py-24 lg:py-[100px]">
      <div className={`${CONTAINER} flex flex-col items-center gap-12 lg:gap-20`}>
        <SectionHeader
          num="002"
          tag="why a graph"
          title="Why ask a graph?"
          sub="Incidents are about relationships: who depends on whom, who owns what, what failed together before. A graph stores exactly that."
        />
        <div className="grid w-full max-w-[1040px] gap-3 md:grid-cols-3">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 120}>
              <article className="h-full rounded-[64px] border border-line bg-cloud p-3 shadow-card sm:rounded-[120px_120px_80px_80px] sm:p-4">
                <div className="relative flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-[56px] bg-ink-soft shadow-[inset_0_0_40px_rgb(255_255_255/0.4),inset_0_0_12px_#fff,inset_0_-2px_2px_#000] sm:aspect-square sm:rounded-[104px_104px_56px_56px]">
                  <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
                  <div className="relative rounded-full bg-[linear-gradient(rgb(255_255_255/0.05),transparent)] p-3">
                    <div className="rounded-full bg-white/30 p-2 shadow-[0_0_80px_rgb(255_255_255/0.6)] backdrop-blur-md">
                      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[linear-gradient(#e6e6e6,#525252)] text-white shadow-[0_2px_4px_rgb(87_87_87/0.5),inset_0_0_24px_rgb(255_255_255/0.4),inset_0_1px_1px_rgb(255_255_255/0.6)] sm:h-[120px] sm:w-[120px]">
                        {v.icon}
                      </div>
                    </div>
                  </div>
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-[10px] bg-[linear-gradient(rgb(255_255_255/0.3),transparent)] px-2.5 py-1.5 text-base text-white backdrop-blur-sm">0{i + 1}</span>
                </div>
                <div className="space-y-2 px-5 py-6 text-center">
                  <h3 className="text-xl font-medium tracking-[-0.03em] text-ink">{v.title}</h3>
                  <p className="text-base leading-[1.35] tracking-[-0.03em] text-ink-soft">{v.text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 003 Capabilities ─────────────────────────────────────────────────────────────────────── */

const CARD = 'h-full rounded-[48px] border border-line bg-cloud p-8 shadow-card sm:rounded-[80px] sm:p-10';
const CHECK = svgIcon(<path d="M3.3 8 6.7 11.3 13.3 4.7" />, 'h-4 w-4 shrink-0 text-muted');

function ToolText({ name, children }) {
  return (
    <p className="text-base leading-[1.35] tracking-[-0.03em] text-ink-soft">
      <code className="font-mono text-[15px] font-medium text-ink">{name}.</code> {children}
    </p>
  );
}

export function Capabilities({ cap }) {
  return (
    <section id="capabilities" className="scroll-mt-24 py-16 sm:py-24 lg:py-[100px]">
      <div className={`${CONTAINER} flex flex-col items-center gap-12 lg:gap-20`}>
        <SectionHeader num="003" tag="capabilities" title="Six tools, one agent" />
        <div className="flex w-full flex-col gap-2">
          <div className="grid gap-2 lg:grid-cols-[2fr_3fr]">
            {/* Tall card: blastRadius */}
            <Reveal className="h-full">
              <article className={`${CARD} flex flex-col justify-between gap-8`}>
                <div className="space-y-6">
                  <ToolText name="blastRadius">The core question: everything that breaks when a service goes down, and how far away it sits.</ToolText>
                  <ul className="space-y-1.5 text-sm tracking-[-0.03em] text-muted">
                    {['Follows DEPENDS_ON up to 3 hops', 'Ranks the impact by service tier', 'Names the owning team of each service'].map((t) => (
                      <li key={t} className="flex items-center gap-1.5">{CHECK}{t}</li>
                    ))}
                  </ul>
                </div>
                <svg viewBox="0 0 300 220" className="w-full" role="img" aria-label="Rings spreading out from a failing service">
                  {[40, 75, 105].map((r, i) => (
                    <circle key={r} cx="150" cy="110" r={r} fill="none" stroke="#fb7185" strokeOpacity={0.35 - i * 0.1} strokeDasharray="3 5" />
                  ))}
                  {[[95, 80], [205, 85], [70, 150], [230, 150], [150, 20], [120, 195]].map(([x, y], i) => (
                    <g key={i}>
                      <line x1="150" y1="110" x2={x} y2={y} stroke="#2dd4bf" strokeWidth="1.4" strokeDasharray="4 4" className="motion-safe:animate-dash" />
                      <circle cx={x} cy={y} r="7" fill="#2dd4bf" stroke="#fff" strokeWidth="2.5" />
                    </g>
                  ))}
                  <circle cx="150" cy="110" r="20" fill="#fb7185" opacity=".2" />
                  <circle cx="150" cy="110" r="10" fill="#fb7185" stroke="#fff" strokeWidth="3" />
                </svg>
              </article>
            </Reveal>

            <div className="grid gap-2 sm:grid-cols-2">
              <Reveal delay={80} className="h-full">
                <article className={`${CARD} flex flex-col justify-between gap-8`}>
                  <ToolText name="serviceContacts">Who to call: the owning team, its Slack channel and the engineers with the most commits.</ToolText>
                  <div className="space-y-2">
                    <span className="inline-block rounded-full bg-violet-100 px-3 py-1 font-mono text-xs text-violet-900">{cap.contacts.slack}</span>
                    {cap.contacts.people.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 text-sm">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-[11px] font-medium text-amber-900">
                          {p.name.split(' ').map((w) => w[0]).join('')}
                        </span>
                        <span className="min-w-0 truncate text-ink">{p.name}</span>
                        <span className="ml-auto shrink-0 font-mono text-[11px] text-faint">{p.commits} commits</span>
                      </div>
                    ))}
                  </div>
                </article>
              </Reveal>
              <Reveal delay={160} className="h-full">
                <article className={`${CARD} flex flex-col justify-between gap-8`}>
                  <ToolText name="incidentHistory">What went wrong before: past incidents that hit a service, with severity and root cause.</ToolText>
                  <div className="space-y-2">
                    {cap.incidents.map((i) => (
                      <div key={i.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 text-sm">
                        <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${i.severity === 'SEV1' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'}`}>{i.severity}</span>
                        <span className="min-w-0 truncate text-ink">{i.title}</span>
                      </div>
                    ))}
                  </div>
                </article>
              </Reveal>
              <Reveal delay={80} className="h-full">
                <article className={`${CARD} flex flex-col justify-between gap-8`}>
                  <ToolText name="dependencyPath">How two services are connected: the shortest chain of dependencies between them.</ToolText>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {cap.path.map((n, i) => (
                      <span key={n} className="flex items-center gap-1.5">
                        {i > 0 && <span className="text-faint" aria-hidden="true">→</span>}
                        <span className="rounded-full bg-white px-2.5 py-1 font-mono text-ink">{n}</span>
                      </span>
                    ))}
                  </div>
                </article>
              </Reveal>
              <Reveal delay={160} className="h-full">
                <article className={`${CARD} flex flex-col justify-between gap-8`}>
                  <ToolText name="criticalServices">Your single points of failure, ranked with the PageRank graph algorithm.</ToolText>
                  <div>
                    <ul className="space-y-1.5">
                      {cap.hubs.map((h) => (
                        <li key={h.service} className="grid grid-cols-[110px_1fr] items-center gap-2 text-xs">
                          <span className="truncate font-mono text-ink">{h.service}</span>
                          <span className="h-2 rounded-full bg-iridescent" style={{ width: `${(h.count / cap.hubs[0].count) * 100}%` }} />
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 font-mono text-[10px] text-faint">bars: direct dependents in the demo graph</p>
                  </div>
                </article>
              </Reveal>
            </div>
          </div>

          <div className="grid gap-2 lg:grid-cols-[2fr_3fr]">
            {/* Call to action */}
            <Reveal className="h-full">
              <article className="flex h-full flex-col justify-between gap-10 rounded-[48px] border border-line bg-iridescent-radial p-8 shadow-glass sm:rounded-[80px] sm:p-10">
                <div className="space-y-6">
                  <div className="flex">
                    <span className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-ink"><Logo className="h-10 w-10" /></span>
                    <span className="-ml-4 flex h-20 w-20 items-center justify-center rounded-full border border-white bg-white/20 text-ink shadow-[inset_0_0_40px_#fff]">
                      {svgIcon(<><path d="M4 5h16v11H8l-4 4z" /><path d="M8 9.5h8M8 12.5h5" /></>, 'h-8 w-8')}
                    </span>
                  </div>
                  <div className="max-w-[90%] space-y-2">
                    <h3 className="text-2xl font-medium leading-[1.1] tracking-[-0.03em] text-ink">Not sure what to ask first?</h3>
                    <p className="text-base leading-[1.35] tracking-[-0.03em] text-ink-soft">
                      Start with an outage you remember: name a service and ask what breaks. The agent offers example questions to get you going.
                    </p>
                  </div>
                </div>
                <div><Button href="/agent">Open the agent</Button></div>
              </article>
            </Reveal>

            {/* Safety */}
            <Reveal delay={120} className="h-full">
              <article className="flex h-full flex-col gap-8 rounded-[48px] border border-line bg-cloud p-5 shadow-card sm:rounded-[80px] sm:p-10">
                <div className="space-y-1 px-3 pt-3 sm:p-0">
                  <h3 className="text-xl font-medium tracking-[-0.03em] text-ink">Safe by default.</h3>
                  <p className="text-sm tracking-[-0.03em] text-muted">
                    <code className="font-mono">createIncident</code> is the only tool that writes, and it can be switched off.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {cap.safety.map(([label, d]) => (
                    <div key={label} className="flex h-[200px] flex-col items-center justify-end gap-5 rounded-[40px] bg-[linear-gradient(180deg,rgb(82_82_82/0.2),#3a3a3a_70%)] p-4 shadow-[inset_0_0_24px_#fff] sm:h-[220px] sm:rounded-[48px]">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/60 text-ink shadow-[inset_0_0_16px_#fff] backdrop-blur">
                        {svgIcon(d, 'h-7 w-7')}
                      </span>
                      <p className="text-balance text-center text-sm leading-tight tracking-[-0.03em] text-white">{label}</p>
                    </div>
                  ))}
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 004 How it works ─────────────────────────────────────────────────────────────────────── */

export function Process() {
  return (
    <section id="process" className="scroll-mt-24 py-16 sm:py-24 lg:py-[100px]">
      <div className={`${CONTAINER} flex flex-col items-center gap-12 lg:gap-20`}>
        <SectionHeader
          num="004"
          tag="how it works"
          title="From question to who to call"
          sub="One loop, a handful of seconds: the model decides what to look up, the graph does the looking."
        />
        <ProcessTimeline />
      </div>
    </section>
  );
}

/* ─── 005 In action ────────────────────────────────────────────────────────────────────────── */

export function Examples({ examples }) {
  return (
    <section id="examples" className="scroll-mt-24 py-16 sm:py-24 lg:py-[100px]">
      <div className={`${CONTAINER} flex flex-col items-center gap-12 lg:gap-20`}>
        <SectionHeader
          num="005"
          tag="in action"
          title="Questions it answers"
          sub="Real answers from the seeded demo graph: a fictional company with 30 services and a year of incidents."
        />
        <Reveal className="w-full max-w-[1040px]"><ExampleCarousel items={examples} /></Reveal>
      </div>
    </section>
  );
}

/* ─── 006 Built with ───────────────────────────────────────────────────────────────────────── */

const STACK = [
  [
    ['FalkorDB', 'graph database', '#fb7185'], ['Cypher', 'query language', '#fb7185'], ['PageRank', 'graph algorithm', '#fb7185'],
    ['Google Gemini', 'language model', '#fbbf24'], ['Vercel AI SDK', 'agent loop + tools', '#a78bfa'],
  ],
  [
    ['Next.js', 'app router', '#525252'], ['React', 'interface', '#2dd4bf'], ['Tailwind CSS', 'styling', '#2dd4bf'],
    ['react-force-graph', 'graph canvas', '#a78bfa'], ['Zod', 'tool input schemas', '#8399ff'],
  ],
  [
    ['Docker', 'runs FalkorDB locally', '#8399ff'], ['Node.js', 'seed script', '#525252'], ['useChat', 'streaming chat', '#a78bfa'],
    ['graph-data.json', 'demo company', '#fbbf24'], ['roQuery', 'read-only lookups', '#fb7185'],
  ],
];

export function Stack() {
  return (
    <section id="stack" className="scroll-mt-24 overflow-hidden py-16 sm:py-24 lg:py-[100px]">
      <div className="flex flex-col items-center gap-12 lg:gap-20">
        <div className={CONTAINER}>
          <SectionHeader num="006" tag="built with" title="The stack behind it" />
        </div>
        <div className="relative w-full">
          <div className="flex flex-col gap-1">
            {STACK.map((row, r) => (
              <Marquee key={r} duration={50 + r * 8} reverse={r === 1} gap={4}>
                {row.map(([name, note, color]) => (
                  <span key={name} className="flex h-[88px] w-[240px] shrink-0 items-center justify-between rounded-[32px] border border-line bg-cloud px-6 shadow-[inset_0_0_1px_2px_#fff,inset_0_-2px_2px_rgb(0_0_0/0.12)]">
                    <span>
                      <span className="block text-lg font-medium tracking-[-0.03em] text-muted">{name}</span>
                      <span className="block font-mono text-[11px] text-faint">{note}</span>
                    </span>
                    <span className="h-3 w-3 rounded-full" style={{ background: color }} aria-hidden="true" />
                  </span>
                ))}
              </Marquee>
            ))}
          </div>
          {/* Centre badge */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-1/2 top-1/2 h-[234px] w-[234px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(#8399ff,#b3e1ff_25%,#ffccfd_70%,#fdffbc)] blur-[20px]" aria-hidden="true" />
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex h-[180px] w-[180px] flex-col items-center justify-center gap-2 rounded-full border border-white bg-[linear-gradient(180deg,#000,#525252)] p-4 text-center text-base tracking-[-0.03em] text-white shadow-[inset_0_0_40px_1px_rgb(255_255_255/0.5),inset_0_0_8px_1px_#fff] transition-transform duration-300 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8399ff]"
            >
              <Logo className="h-12 w-12" />
              View the source
            </a>
          </div>
        </div>
        <Reveal className={CONTAINER}>
          <p className={`${LEAD} mx-auto`}>
            A graph database for the relationships, a language model for the conversation, and a small set of tested tools in between.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── 007 FAQs ─────────────────────────────────────────────────────────────────────────────── */

export function Faq({ items }) {
  return (
    <section id="faq" className="scroll-mt-24 bg-[linear-gradient(180deg,#fff,#b7b7b7)] px-5 py-16 sm:px-10 sm:py-24 lg:px-20 lg:py-[100px]">
      <div className="mx-auto flex max-w-[1040px] flex-col items-center gap-12 lg:gap-20">
        <SectionHeader num="007" tag="FAQs" title="Common questions" />
        <div className="flex w-full flex-col gap-2.5">
          {items.map(([q, a], i) => (
            <details
              key={q}
              name="faq"
              open={i === 0}
              className="group rounded-[36px] border-2 border-transparent bg-white/40 transition-colors open:[background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(90deg,#c9aaff,#fdffbc,#ffccfd,#a7f3e4,#8399ff)_border-box] open:rounded-[50px]"
            >
              <summary className="flex cursor-pointer list-none items-center gap-4 rounded-[36px] p-5 sm:p-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8399ff] [&::-webkit-details-marker]:hidden">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-line bg-cloud text-sm text-ink shadow-[inset_0_0_1px_2px_#fff,inset_0_-2px_1px_rgb(0_0_0/0.12)]">{i + 1}</span>
                <span className="flex-1 text-lg font-medium leading-[1.35] tracking-[-0.03em] text-ink sm:text-xl">{q}</span>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-white shadow-[inset_0_0_8px_#fff] transition-colors group-open:bg-white group-open:text-ink group-open:shadow-[inset_0_0_0_2px_#e6e6e6]">
                  {svgIcon(<path d="M12 5v14M5 12h14" />, 'h-6 w-6 transition-transform duration-300 group-open:rotate-45')}
                </span>
              </summary>
              <p className="max-w-[640px] px-5 pb-6 text-base leading-[1.45] tracking-[-0.03em] text-ink-soft sm:pl-[72px]">{a}</p>
            </details>
          ))}
        </div>
        <Reveal className="flex flex-col items-center gap-2">
          <p className={LEAD}>Have another question?</p>
          <Button href={GITHUB_URL} variant="ghost">Ask on GitHub</Button>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── Closing call to action + footer ──────────────────────────────────────────────────────── */

const FOOTER_LINKS = [['What it is', '#about'], ['Capabilities', '#capabilities'], ['How it works', '#process'], ['In action', '#examples'], ['FAQs', '#faq']];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-mist px-5 sm:px-10 lg:px-20">
      {/* Slow-drifting colour in place of the reference's background video */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-40 top-1/4 h-[520px] w-[520px] rounded-full bg-[#c9aaff] opacity-50 blur-[120px] motion-safe:animate-float" />
        <div className="absolute -right-32 top-1/3 h-[480px] w-[480px] rounded-full bg-[#a7f3e4] opacity-50 blur-[120px] motion-safe:animate-float [animation-delay:-3s]" />
        <div className="absolute bottom-0 left-1/3 h-[420px] w-[560px] rounded-full bg-[#ffccfd] opacity-60 blur-[120px] motion-safe:animate-float [animation-delay:-1.5s]" />
        <div className="absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(180deg,#b7b7b7,transparent)]" />
      </div>

      <div className="relative mx-auto flex max-w-[1280px] flex-col items-center gap-16 pt-10 sm:gap-20 sm:pt-20">
        <Reveal className="w-full max-w-[680px]">
          <div className="flex flex-col items-center gap-6 rounded-[56px] bg-[linear-gradient(rgb(0_0_0/0.6),rgb(0_0_0/0.35))] px-6 pb-12 pt-10 text-center shadow-[inset_0_0_4px_rgb(255_255_255/0.8),inset_0_0_40px_#fff] backdrop-blur-xl sm:rounded-[120px] sm:px-16 sm:pb-16">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-black/40 backdrop-blur"><Logo className="h-12 w-12" /></span>
            <h2 className="text-[28px] font-medium leading-[1.1] tracking-[-0.03em] text-white sm:text-[32px]">
              Ask the graph<br />before the pager does.
            </h2>
            <p className="max-w-[420px] text-base leading-[1.35] tracking-[-0.03em] text-white/85">
              Open the agent, pick a service, and see its blast radius light up in seconds.
            </p>
            <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row sm:gap-2">
              <Button href="/agent">Open the agent</Button>
              <Button href={GITHUB_URL} variant="glass">View on GitHub</Button>
            </div>
          </div>
        </Reveal>

        <div className="w-full">
          <nav aria-label="Footer" className="flex flex-wrap justify-between gap-x-8 gap-y-4 border-b border-black/10 pb-6">
            {FOOTER_LINKS.map(([label, href]) => (
              <a key={href} href={href} className="text-sm tracking-[-0.03em] text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                {label}
              </a>
            ))}
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-sm tracking-[-0.03em] text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
              GitHub ↗
            </a>
          </nav>
          <div className="flex flex-col gap-2 pt-6 text-sm tracking-[-0.03em] text-ink-soft sm:flex-row sm:justify-between">
            <span>Blast Radius · an incident agent on FalkorDB</span>
            <span>Demo data of a fictional company</span>
          </div>
          <p
            className="pointer-events-none -mb-[0.1em] mt-6 select-none text-center text-[22vw] font-semibold leading-[0.8] tracking-[-0.08em] text-white/60 lg:text-[220px]"
            aria-hidden="true"
          >
            blast radius
          </p>
        </div>
      </div>
    </footer>
  );
}
