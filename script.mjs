import { readFile } from 'node:fs/promises';
import { FalkorDB } from 'falkordb';

const data = JSON.parse(
  await readFile(new URL('./graph-data.json', import.meta.url), 'utf8'),
);

const db = await FalkorDB.connect({
  host: 'localhost',
  port: 6379,
});

// Use the SAME graph name as your browser: practice
const graph = db.selectGraph('practice');

// Indexes on the keys we MERGE/MATCH on. Creating an existing index throws, so ignore that.
const INDEXES = [
  'CREATE INDEX FOR (s:Service) ON (s.name)',
  'CREATE INDEX FOR (t:Team) ON (t.name)',
  'CREATE INDEX FOR (p:Person) ON (p.id)',
  'CREATE INDEX FOR (i:Incident) ON (i.id)',
];

// Every statement uses MERGE, so re-running the script does not create duplicates.
const SEED = [
  {
    params: { teams: data.teams },
    query: `
      UNWIND $teams AS t
      MERGE (team:Team {name: t.name})
      SET team.slack = t.slack, team.focus = t.focus`,
  },
  {
    params: { services: data.services },
    query: `
      UNWIND $services AS s
      MERGE (svc:Service {name: s.name})
      SET svc.tier = s.tier, svc.type = s.type, svc.tech = s.tech, svc.description = s.description
      WITH svc, s
      MATCH (team:Team {name: s.owner})
      MERGE (team)-[:OWNS]->(svc)`,
  },
  {
    params: { people: data.people },
    query: `
      UNWIND $people AS p
      MERGE (person:Person {id: p.id})
      SET person.name = p.name, person.role = p.role
      WITH person, p
      MATCH (team:Team {name: p.team})
      MERGE (person)-[:MEMBER_OF]->(team)`,
  },
  {
    params: { deps: data.dependencies },
    query: `
      UNWIND $deps AS d
      MATCH (a:Service {name: d.from}), (b:Service {name: d.to})
      MERGE (a)-[r:DEPENDS_ON]->(b)
      SET r.via = d.via`,
  },
  {
    params: { workedOn: data.workedOn },
    query: `
      UNWIND $workedOn AS w
      MATCH (p:Person {id: w.person}), (s:Service {name: w.service})
      MERGE (p)-[r:WORKED_ON]->(s)
      SET r.commits = w.commits, r.lastActive = w.lastActive`,
  },
  {
    params: { incidents: data.incidents },
    query: `
      UNWIND $incidents AS i
      MERGE (inc:Incident {id: i.id})
      SET inc.title = i.title, inc.severity = i.severity, inc.startedAt = i.startedAt,
          inc.durationMinutes = i.durationMinutes, inc.rootCause = i.rootCause
      WITH inc, i
      MATCH (s:Service {name: i.originatedIn})
      MERGE (inc)-[:ORIGINATED_IN]->(s)`,
  },
  {
    params: { incidents: data.incidents },
    query: `
      UNWIND $incidents AS i
      UNWIND i.affected AS name
      MATCH (inc:Incident {id: i.id}), (s:Service {name: name})
      MERGE (inc)-[:AFFECTED]->(s)`,
  },
  {
    params: { incidents: data.incidents },
    query: `
      UNWIND $incidents AS i
      UNWIND i.responders AS pid
      MATCH (inc:Incident {id: i.id}), (p:Person {id: pid})
      MERGE (p)-[:RESPONDED_TO]->(inc)`,
  },
];

try {
  for (const q of INDEXES) {
    try {
      await graph.query(q);
    } catch (error) {
      if (!/already indexed/i.test(error.message)) throw error;
    }
  }

  for (const { query, params } of SEED) {
    await graph.query(query, { params });
  }

  // Sanity checks: expect 63 nodes and 262 relationships (see expected-results.md)
  const nodes = await graph.roQuery(`
    MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY label
  `);
  const rels = await graph.roQuery(`
    MATCH ()-[r]->() RETURN type(r) AS type, count(r) AS count ORDER BY type
  `);

  console.table(nodes.data);
  console.table(rels.data);
  console.log('Total nodes:', nodes.data.reduce((sum, row) => sum + row.count, 0));
  console.log('Total relationships:', rels.data.reduce((sum, row) => sum + row.count, 0));
} catch (error) {
  console.error('FalkorDB error:', error);
} finally {
  await db.close();
}
