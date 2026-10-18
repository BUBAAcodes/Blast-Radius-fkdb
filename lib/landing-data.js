// Numbers and example answers for the landing page, computed from the seed data (graph-data.json)
// with the same logic as the agent's Cypher in lib/queries.js. Nothing on the landing page is
// typed in by hand, so it can't drift from what the agent really answers on the demo graph.
import data from '@/graph-data.json';

const byName = Object.fromEntries(data.services.map((s) => [s.name, s]));
const slackOf = Object.fromEntries(data.teams.map((t) => [t.name, t.slack]));

// Who depends on whom, reversed: dependents[x] = services with a DEPENDS_ON link to x.
const dependents = {};
const dependsOn = {};
for (const d of data.dependencies) {
  (dependents[d.to] ??= []).push(d.from);
  (dependsOn[d.from] ??= []).push(d.to);
}

export const stats = {
  services: data.services.length,
  teams: data.teams.length,
  people: data.people.length,
  incidents: data.incidents.length,
  dependencies: data.dependencies.length,
  tools: 6,
  maxHops: 3,
  maxSteps: 6,
};

export const serviceNames = data.services.map((s) => s.name);

// Same as Q.blastRadius: every service that depends on `name` within `maxHops`, at its shortest
// distance, ordered by hops, tier, name. `via` is the first service on the way back to `name`.
export function blastRadius(name, maxHops = 3) {
  const seen = new Map([[name, { hops: 0, via: null }]]);
  let frontier = [name];
  for (let hop = 1; hop <= maxHops; hop++) {
    const next = [];
    for (const target of frontier) {
      for (const s of dependents[target] ?? []) {
        if (seen.has(s)) continue;
        seen.set(s, { hops: hop, via: hop === 1 ? null : (seen.get(target).via ?? target) });
        next.push(s);
      }
    }
    frontier = next;
  }
  seen.delete(name);
  return [...seen].map(([service, { hops, via }]) => ({
    service, hops, via, tier: byName[service].tier, team: byName[service].owner,
  })).sort((a, b) => a.hops - b.hops || a.tier - b.tier || a.service.localeCompare(b.service));
}

// Same as Q.incidentHistory: incidents that affected `name`, newest first.
export function incidentHistory(name) {
  return data.incidents
    .filter((i) => i.affected.includes(name))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

// Same as Q.dependencyPath: the shortest DEPENDS_ON chain from `from` to `to`.
export function dependencyPath(from, to) {
  const prev = new Map([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === to) break;
    for (const n of dependsOn[cur] ?? []) {
      if (!prev.has(n)) { prev.set(n, cur); queue.push(n); }
    }
  }
  if (!prev.has(to)) return null;
  const path = [];
  for (let n = to; n; n = prev.get(n)) path.unshift(n);
  return path;
}

export const service = (name) => ({ ...byName[name], slack: slackOf[byName[name].owner] });

// Same as the people part of Q.serviceContacts: who worked on `name`, most commits first.
export function contributors(name) {
  const people = Object.fromEntries(data.people.map((p) => [p.id, p]));
  return data.workedOn
    .filter((w) => w.service === name)
    .sort((a, b) => b.commits - a.commits)
    .map((w) => ({ ...people[w.person], commits: w.commits }));
}

// Services with the most direct dependents (the raw signal PageRank builds on).
export function mostDependedOn(limit = 4) {
  return Object.entries(dependents)
    .map(([name, list]) => ({ service: name, count: list.length }))
    .sort((a, b) => b.count - a.count || a.service.localeCompare(b.service))
    .slice(0, limit);
}
