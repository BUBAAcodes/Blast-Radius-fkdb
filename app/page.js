// Landing page. Light editorial look inspired by the Conicorn template: floating nav, dark hero that
// fades into soft greys, numbered sections and very round cards with iridescent accents.
// Every number and example below is computed from the seed data (lib/landing-data.js) with the
// same logic as the agent's queries, so the page can't promise anything the agent doesn't do.
import Nav from '@/components/landing/Nav';
import { About, Capabilities, Examples, Faq, Footer, Hero, Process, Stack, Value } from '@/components/landing/Sections';
import { Q } from '@/lib/queries';
import {
  blastRadius, contributors, dependencyPath, incidentHistory, mostDependedOn, service, serviceNames, stats,
} from '@/lib/landing-data';

const clean = (cypher) => cypher.replace(/\s+/g, ' ').trim();
const date = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

// The product preview: "What breaks if payments-service goes down?"
const ROOT = 'payments-service';
const impacted = blastRadius(ROOT);
const owner = service(ROOT);
const notify = [...new Set(impacted.map((s) => s.team))]
  .filter((t) => t !== owner.owner)
  .map((t) => service(impacted.find((s) => s.team === t).service).slack);

const preview = {
  question: `What breaks if ${ROOT} goes down?`,
  root: ROOT,
  owner: { team: owner.owner, slack: owner.slack },
  impacted,
  notify,
  cypher: [
    ['blastRadius', `{"service":"${ROOT}"}`, impacted.length, clean(Q.blastRadius(3))],
    ['serviceContacts', `{"service":"${ROOT}"}`, contributors(ROOT).length, clean(Q.serviceContacts)],
  ],
};

// The "in action" carousel.
const checkout = incidentHistory('checkout-service');
const path = dependencyPath('web-app', 'user-db');
const examples = [
  {
    kind: 'blast',
    question: preview.question,
    blurb: `The agent follows DEPENDS_ON links backwards, ranks what it finds by tier, then looks up who owns ${ROOT} so you know who to wake up.`,
    tools: ['blastRadius', 'serviceContacts'],
    root: ROOT,
    impacted,
    metrics: [
      [impacted.length, 'services impacted'],
      [impacted.filter((s) => s.tier === 1).length, 'tier 1 services'],
      [new Set(impacted.map((s) => s.team)).size, 'teams to notify'],
    ],
  },
  {
    kind: 'history',
    question: 'Has checkout-service failed before?',
    blurb: 'Incident history shows the pattern a dashboard hides: checkout keeps going down because of the services it depends on.',
    tools: ['incidentHistory'],
    incidents: checkout.map((i) => ({ id: i.id, severity: i.severity, date: date(i.startedAt), root: i.originatedIn, minutes: i.durationMinutes })),
    metrics: [
      [checkout.length, 'past incidents'],
      [checkout.filter((i) => i.severity === 'SEV1').length, 'were SEV1'],
      [checkout.filter((i) => i.originatedIn !== 'checkout-service').length, 'started elsewhere'],
    ],
  },
  {
    kind: 'path',
    question: 'How does web-app depend on user-db?',
    blurb: 'The shortest chain of dependencies between two services, so you can see exactly why a database problem reaches the front end.',
    tools: ['dependencyPath'],
    path,
    metrics: [
      [path.length - 1, 'hops'],
      [path.length - 2, 'services between'],
      [new Set(path.map((n) => service(n).owner)).size, 'teams involved'],
    ],
  },
];

const cap = {
  contacts: { slack: owner.slack, people: contributors(ROOT) },
  incidents: checkout.slice(0, 3),
  path,
  hubs: mostDependedOn(4),
  safety: [
    ['Read-only graph queries', <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>],
    ['One write action you can turn off', <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>],
    [`At most ${stats.maxSteps} steps per question`, <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>],
    ['Cypher shown with every answer', <><path d="m8 7-5 5 5 5M16 7l5 5-5 5" /></>],
  ],
};

const faq = [
  ['What data does it use?', `A demo graph of a fictional company: ${stats.services} services, ${stats.teams} teams, ${stats.people} engineers and ${stats.incidents} past incidents, loaded from graph-data.json by the seed script. Swap in your own data to use it for real.`],
  ['Does the AI write database queries?', `No. The agent chooses from ${stats.tools} tested Cypher queries and only fills in their parameters, such as a service name. It can't run anything else, and you can read the exact query behind every answer.`],
  ['Can it change anything?', 'Lookups are read-only. The one action, createIncident, adds an incident to the graph and links the affected services; set ALLOW_WRITES=false to turn it off.'],
  ['Which model does it use?', 'Google Gemini through the Vercel AI SDK. The model is set with the GEMINI_MODEL environment variable, and each question is capped at 6 model steps to limit cost and loops.'],
  ['How do I run it myself?', 'Start FalkorDB in Docker, run npm run seed -- --reset to load the demo graph, then npm run dev and open /agent. You need a Gemini API key in .env.local.'],
  ['Why FalkorDB?', 'A graph database stores relationships directly, so multi-hop questions like "what depends on this, three levels out" are one fast query, and algorithms like PageRank are built in.'],
];

export default function Home() {
  return (
    <div className="min-h-dvh bg-white font-sans text-ink antialiased">
      <a href="#about" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <Nav />
      <main>
        <Hero serviceNames={serviceNames} />
        <About preview={preview} stats={stats} />
        <Value />
        <Capabilities cap={cap} />
        <Process />
        <Examples examples={examples} />
        <Stack />
        <Faq items={faq} />
      </main>
      <Footer />
    </div>
  );
}
