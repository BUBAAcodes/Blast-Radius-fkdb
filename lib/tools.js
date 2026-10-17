// The agent's tools. Each tool = a description the model reads + an input schema + a function
// that runs tested Cypher. The model never writes Cypher itself; it only picks a tool and fills
// in the inputs.
//
// Every tool returns the same shape, which the UI uses for the graph highlight and evidence panel:
//   { summary, rows, cypher, focus, highlight: { nodes: [nodeId], links: [{ source, target, type }] } }
import { tool } from 'ai';
import { z } from 'zod';
import { run } from './falkor.js';
import { Q, nodeId } from './queries.js';

const svc = (name) => nodeId('Service', name);
const clean = (cypher) => cypher.replace(/\s+/g, ' ').trim();

// Turns "payments" into "payments-service". Returns { name } or { error, suggestions }.
async function resolveService(input) {
  const q = String(input).trim().toLowerCase();
  const rows = await run(Q.resolveService, { q });
  const exact = rows.find((r) => r.name === q);
  if (exact) return { name: exact.name };
  if (rows.length === 1) return { name: rows[0].name };
  return {
    error: rows.length
      ? `"${input}" matches several services. Ask which one, or pick from the suggestions.`
      : `No service called "${input}".`,
    suggestions: rows.map((r) => r.name),
  };
}

const serviceInput = z
  .string()
  .describe('Service name, for example "payments-service". Partial names like "payments" also work.');

export const tools = {
  blastRadius: tool({
    description:
      'Find every service that would break if a given service goes down, by following DEPENDS_ON ' +
      'links backwards up to 3 hops. Returns each impacted service with its distance (hops), tier ' +
      '(1 = most critical) and owning team. Use for "what breaks if X fails" or "impact of X".',
    inputSchema: z.object({
      service: serviceInput,
      maxHops: z.number().int().min(1).max(3).default(3).describe('How many hops to follow, 1 to 3.'),
    }),
    execute: async ({ service, maxHops = 3 }) => {
      const s = await resolveService(service);
      if (s.error) return s;
      const cypher = Q.blastRadius(maxHops);
      const rows = await run(cypher, { name: s.name });
      const names = [s.name, ...rows.map((r) => r.service)];
      const deps = await run(Q.dependsOnAmong, { names });
      const teams = [...new Set(rows.map((r) => r.team).filter(Boolean))];
      return {
        summary: `${rows.length} services depend on ${s.name} within ${maxHops} hops`,
        rows,
        cypher: clean(cypher),
        focus: svc(s.name),
        highlight: {
          nodes: [...names.map(svc), ...teams.map((t) => nodeId('Team', t))],
          links: [
            ...deps.map((d) => ({ source: svc(d.source), target: svc(d.target), type: 'DEPENDS_ON' })),
            ...rows.filter((r) => r.team).map((r) => ({
              source: nodeId('Team', r.team), target: svc(r.service), type: 'OWNS',
            })),
          ],
        },
      };
    },
  }),

  serviceContacts: tool({
    description:
      'Find who to contact about a service: the owning team (with its Slack channel) and the ' +
      'engineers who worked on it, ordered by number of commits. Use for "who owns X" or "who knows X".',
    inputSchema: z.object({ service: serviceInput }),
    execute: async ({ service }) => {
      const s = await resolveService(service);
      if (s.error) return s;
      const rows = await run(Q.serviceContacts, { name: s.name });
      const team = rows[0]?.team;
      const people = rows.filter((r) => r.personId);
      return {
        summary: `${s.name} is owned by ${team ?? 'no team'}; ${people.length} people worked on it`,
        rows,
        cypher: clean(Q.serviceContacts),
        focus: svc(s.name),
        highlight: {
          nodes: [svc(s.name), ...(team ? [nodeId('Team', team)] : []), ...people.map((p) => nodeId('Person', p.personId))],
          links: [
            ...(team ? [{ source: nodeId('Team', team), target: svc(s.name), type: 'OWNS' }] : []),
            ...people.map((p) => ({ source: nodeId('Person', p.personId), target: svc(s.name), type: 'WORKED_ON' })),
          ],
        },
      };
    },
  }),

  incidentHistory: tool({
    description:
      'List past incidents that affected a service, newest first, with severity, root cause and the ' +
      'service the incident started in. Use for "has X failed before" or "incident history of X".',
    inputSchema: z.object({ service: serviceInput }),
    execute: async ({ service }) => {
      const s = await resolveService(service);
      if (s.error) return s;
      const rows = await run(Q.incidentHistory, { name: s.name });
      const roots = [...new Set(rows.map((r) => r.rootService).filter(Boolean))];
      return {
        summary: `${rows.length} past incidents affected ${s.name}`,
        rows,
        cypher: clean(Q.incidentHistory),
        focus: svc(s.name),
        highlight: {
          nodes: [svc(s.name), ...roots.map(svc), ...rows.map((r) => nodeId('Incident', r.id))],
          links: [
            ...rows.map((r) => ({ source: nodeId('Incident', r.id), target: svc(s.name), type: 'AFFECTED' })),
            ...rows.filter((r) => r.rootService).map((r) => ({
              source: nodeId('Incident', r.id), target: svc(r.rootService), type: 'ORIGINATED_IN',
            })),
          ],
        },
      };
    },
  }),

  dependencyPath: tool({
    description:
      'Find the shortest chain of dependencies from one service to another (A depends on ... depends ' +
      'on B). Use for "how is A connected to B" or "why does A break when B fails".',
    inputSchema: z.object({
      from: serviceInput.describe('The service that depends on something, e.g. "web-app".'),
      to: serviceInput.describe('The service it may depend on, e.g. "user-db".'),
    }),
    execute: async ({ from, to }) => {
      const a = await resolveService(from);
      if (a.error) return a;
      const b = await resolveService(to);
      if (b.error) return b;
      const rows = await run(Q.dependencyPath, { from: a.name, to: b.name });
      const path = rows[0]?.path;
      if (!path) {
        return {
          summary: `${a.name} does not depend on ${b.name}, directly or indirectly`,
          rows: [], cypher: clean(Q.dependencyPath), focus: svc(a.name),
          highlight: { nodes: [svc(a.name), svc(b.name)], links: [] },
        };
      }
      return {
        summary: `${a.name} reaches ${b.name} in ${path.length - 1} hops: ${path.join(' -> ')}`,
        rows: [{ path, hops: path.length - 1 }],
        cypher: clean(Q.dependencyPath),
        focus: svc(a.name),
        highlight: {
          nodes: path.map(svc),
          links: path.slice(1).map((name, i) => ({ source: svc(path[i]), target: svc(name), type: 'DEPENDS_ON' })),
        },
      };
    },
  }),

  criticalServices: tool({
    description:
      'Rank the most critical services using the PageRank graph algorithm over DEPENDS_ON links: ' +
      'a service scores high when many (important) services depend on it. Use for "what are our ' +
      'riskiest / most critical / single points of failure".',
    inputSchema: z.object({
      limit: z.number().int().min(1).max(10).default(5).describe('How many services to return.'),
    }),
    execute: async ({ limit = 5 }) => {
      const rows = (await run(Q.criticalServices, { limit })).map((r) => ({
        ...r, score: Math.round(r.score * 10000) / 10000,
      }));
      const names = rows.map((r) => r.service);
      const deps = await run(Q.dependsOnAmong, { names });
      return {
        summary: `Top ${rows.length} services by PageRank: ${names.join(', ')}`,
        rows,
        cypher: clean(Q.criticalServices),
        focus: names[0] ? svc(names[0]) : null,
        highlight: {
          nodes: names.map(svc),
          links: deps.map((d) => ({ source: svc(d.source), target: svc(d.target), type: 'DEPENDS_ON' })),
        },
      };
    },
  }),

  createIncident: tool({
    description:
      'ACTION: open a new incident in the graph for a failing service, link the services it affects, ' +
      'and return the owning team and Slack channel to notify. Only use when the user asks to open, ' +
      'create or log an incident. Run blastRadius first so you can pass the affected services.',
    inputSchema: z.object({
      service: serviceInput.describe('The service where the problem started.'),
      title: z.string().min(3).max(120).describe('Short incident title.'),
      severity: z.enum(['SEV1', 'SEV2', 'SEV3']).describe('SEV1 = most severe.'),
      affected: z.array(z.string()).max(30).default([]).describe('Other impacted service names, from blastRadius.'),
    }),
    execute: async ({ service, title, severity, affected = [] }) => {
      if (process.env.ALLOW_WRITES === 'false') {
        return { error: 'Creating incidents is turned off on this deployment.' };
      }
      const s = await resolveService(service);
      if (s.error) return s;
      const id = `INC-${Date.now().toString(36).toUpperCase()}`;
      const [created] = await run(
        Q.createIncident,
        { service: s.name, id, title, severity, startedAt: new Date().toISOString() },
        { write: true },
      );
      const others = affected.filter((n) => n !== s.name);
      if (others.length) await run(Q.linkAffected, { id, names: others }, { write: true });
      const linked = [s.name, ...others];
      return {
        summary: `Opened ${id} (${severity}) on ${s.name}; notify ${created?.team ?? 'the owner'} in ${created?.slack ?? 'their channel'}`,
        rows: [{ id, severity, title, team: created?.team, slack: created?.slack, affected: linked }],
        cypher: clean(Q.createIncident),
        focus: nodeId('Incident', id),
        graphChanged: true,
        highlight: {
          nodes: [nodeId('Incident', id), ...linked.map(svc)],
          links: [
            { source: nodeId('Incident', id), target: svc(s.name), type: 'ORIGINATED_IN' },
            ...linked.map((n) => ({ source: nodeId('Incident', id), target: svc(n), type: 'AFFECTED' })),
          ],
        },
      };
    },
  }),
};
