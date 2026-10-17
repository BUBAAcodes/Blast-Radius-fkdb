// Landing page. Dark developer-tool look: ASCII shockwave hero, a terminal demo, how it works,
// the stack, and a final call to action. The accents are the graph's node colours (lib/colors.js),
// so this page and the agent at /agent read as one product.
import Link from "next/link";
import data from "@/graph-data.json";
import { COLORS } from "@/lib/colors";
import Logo from "@/components/Logo";
import AsciiShockwave from "@/components/landing/AsciiShockwave";
import TerminalDemo from "@/components/landing/TerminalDemo";
import Reveal from "@/components/landing/Reveal";

const GITHUB_URL = "https://github.com/BUBAAcodes/Fkdb-AI-agent";

const STEPS = [
  {
    color: COLORS.Service,
    title: "A graph in FalkorDB",
    text: `${data.services.length} services, ${data.teams.length} teams, ${data.people.length} engineers and ${data.incidents.length} past incidents, linked by dependencies, ownership and commits.`,
    icon: (
      <>
        <circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" />
        <path d="M8 7.5 10.5 16M16 7.5 13.5 16M8.5 6h7" />
      </>
    ),
  },
  {
    color: COLORS.Team,
    title: "The agent picks the queries",
    text: "Gemini reads your question and chooses from six tested Cypher queries. It fills in the inputs; it never writes Cypher or guesses.",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m7 10 3 2-3 2M12 15h5" />
      </>
    ),
  },
  {
    color: COLORS.Incident,
    title: "It finds the blast radius",
    text: "It follows DEPENDS_ON links backwards up to 3 hops, ranks impact by tier, and lights up that part of the graph.",
    icon: (
      <>
        <circle cx="12" cy="12" r="2.5" /><circle cx="12" cy="12" r="6" opacity="0.6" /><circle cx="12" cy="12" r="9.5" opacity="0.3" />
      </>
    ),
  },
  {
    color: COLORS.Person,
    title: "It tells you who to notify",
    text: "Owning teams with their Slack channels, the engineers who know the code best, and it can open the incident for you.",
    icon: (
      <>
        <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </>
    ),
  },
];

const STACK = [
  { name: "FalkorDB", note: "graph database", color: COLORS.Incident },
  { name: "Google Gemini", note: "LLM", color: COLORS.Person },
  { name: "Vercel AI SDK", note: "agent + tools", color: COLORS.Team },
  { name: "Next.js", note: "app router", color: "#e2e8f0" },
  { name: "React", note: "UI", color: COLORS.Service },
  { name: "Tailwind CSS", note: "styling", color: COLORS.Service },
  { name: "react-force-graph", note: "graph canvas", color: COLORS.Team },
];

function GitHubIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function PrimaryButton({ children }) {
  return (
    <Link
      href="/agent"
      className="group inline-flex items-center gap-2 rounded-md bg-teal-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_24px_-6px_#2dd4bf] transition-all hover:bg-teal-300 hover:shadow-[0_0_32px_-4px_#2dd4bf]"
    >
      {children}
      <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
    </Link>
  );
}

function SectionLabel({ children }) {
  return <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal-400">{children}</p>;
}

export default function Home() {
  return (
    <div className="min-h-dvh bg-[#05070d] font-sans text-slate-300 antialiased">
      {/* Nav */}
      <nav className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-mono text-sm font-medium text-slate-100">
            <Logo className="h-6 w-6" /> blast-radius
          </Link>
          <div className="flex items-center gap-5 font-mono text-xs">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-slate-400 transition-colors hover:text-slate-100">
              <GitHubIcon className="h-4 w-4" /> <span className="hidden sm:inline">GitHub</span>
            </a>
            <Link href="/agent" className="text-teal-400 transition-colors hover:text-teal-300">
              open agent →
            </Link>
          </div>
        </div>
      </nav>

      {/* 1. Hero */}
      <header className="relative flex min-h-[640px] items-center justify-center overflow-hidden px-4 pb-16 pt-28 sm:min-h-[720px] lg:h-dvh lg:max-h-[860px]">
        <AsciiShockwave />
        {/* Darken behind the text so it stays readable over the animation */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_42%_32%_at_center,#05070d_20%,transparent_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#05070d]" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 font-mono text-[11px] text-slate-400 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
            incident agent · graph-powered
          </p>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-slate-50 sm:text-6xl lg:text-7xl">
            Know what <em className="font-serif font-normal italic text-rose-400">breaks</em>
            <br className="hidden sm:block" /> before it breaks.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-slate-400 sm:text-lg">
            An incident agent that reasons over a FalkorDB dependency graph
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PrimaryButton>Open the agent</PrimaryButton>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950/60 px-5 py-2.5 text-sm font-medium text-slate-200 backdrop-blur transition-colors hover:border-slate-500 hover:bg-slate-900"
            >
              <GitHubIcon className="h-4 w-4" /> View on GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-28 px-4 pb-20 sm:space-y-36 sm:px-6">
        {/* 2. Terminal demo */}
        <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <Reveal className="space-y-4">
            <SectionLabel>// demo</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              Ask in plain English. <br className="hidden sm:block" />Get the graph's answer.
            </h2>
            <p className="max-w-md text-slate-400">
              Every fact in the answer comes from a graph query, and the agent shows which ones it ran. This is
              the real result for the seeded data.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <TerminalDemo />
          </Reveal>
        </section>

        {/* 3. How it works */}
        <section className="space-y-10">
          <Reveal className="space-y-4">
            <SectionLabel>// how it works</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">From question to who to call.</h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 100}>
                <div className="group relative h-full rounded-xl border border-slate-800 bg-slate-900/30 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900/60">
                  <div
                    className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }}
                  />
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-lg border"
                      style={{ color: s.color, borderColor: `${s.color}40`, background: `${s.color}12` }}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {s.icon}
                      </svg>
                    </span>
                    <span className="font-mono text-xs text-slate-600">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 font-medium text-slate-100">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* 4. Built with */}
        <section className="space-y-6">
          <Reveal>
            <SectionLabel>// built with</SectionLabel>
          </Reveal>
          <Reveal delay={100}>
            <div className="flex flex-wrap gap-3">
              {STACK.map((t) => (
                <span
                  key={t.name}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/30 px-3.5 py-2 text-sm transition-colors hover:border-slate-600"
                >
                  <span className="h-2 w-2 rounded-sm" style={{ background: t.color }} />
                  <span className="font-medium text-slate-200">{t.name}</span>
                  <span className="font-mono text-xs text-slate-500">{t.note}</span>
                </span>
              ))}
            </div>
          </Reveal>
        </section>

        {/* 5. Final call to action */}
        <Reveal>
          <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-transparent px-6 py-16 text-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,#2dd4bf1f,transparent)]" />
            <div className="relative">
              <p className="font-mono text-sm text-slate-500">
                <span className="text-teal-400">❯</span> what breaks if ___ goes down?
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
                Ask the graph before the pager does.
              </h2>
              <div className="mt-8 flex justify-center">
                <PrimaryButton>Open the agent</PrimaryButton>
              </div>
            </div>
          </section>
        </Reveal>
      </main>

      <footer className="border-t border-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 font-mono text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="flex items-center gap-2">
            <Logo className="h-4 w-4" /> blast-radius · demo data of a fictional company
          </span>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-slate-300">
            github.com/BUBAAcodes/Fkdb-AI-agent
          </a>
        </div>
      </footer>
    </div>
  );
}
