// Loads graph-data.json into FalkorDB.
// Safe to re-run: every node and relationship uses MERGE, so nothing gets duplicated.
// Usage:  npm run seed            (add or update data)
//         npm run seed -- --reset (delete the graph first, then load fresh)
import { readFile } from 'node:fs/promises';
import { FalkorDB } from 'falkordb';

const GRAPH = process.env.FALKORDB_GRAPH || 'outages';
const data = JSON.parse(await readFile(new URL('./graph-data.json', import.meta.url), 'utf8'));

const host = process.env.FALKORDB_HOST || 'localhost';
const port = Number(process.env.FALKORDB_PORT || 6379);
const db = await FalkorDB.connect({
  ...(process.env.FALKORDB_TLS === 'true' ? { socket: { host, port, tls: true } } : { host, port }),
  username: process.env.FALKORDB_USERNAME || undefined,
  password: process.env.FALKORDB_PASSWORD || undefined,
});
const graph = db.selectGraph(GRAPH);
const run = (cypher, params = {}) => graph.query(cypher, { params });

if (process.argv.includes('--reset')) {
  try { await graph.delete(); console.log(`Deleted graph "${GRAPH}"`); } catch { /* graph did not exist yet */ }
}

// Indexes make the lookups by name/id fast. They error if they already exist, so ignore that.
for (const idx of [
  'CREATE INDEX FOR (s:Service) ON (s.name)',
  'CREATE INDEX FOR (t:Team) ON (t.name)',
  'CREATE INDEX FOR (p:Person) ON (p.id)',
  'CREATE INDEX FOR (i:Incident) ON (i.id)',
]) {
  try { await run(idx); } catch { /* already exists */ }
}

// Nodes. UNWIND sends a whole list in one query instead of one query per item.
await run(`UNWIND $rows AS row
  MERGE (t:Team {name: row.name})
  SET t.slack = row.slack, t.focus = row.focus`, { rows: data.teams });

await run(`UNWIND $rows AS row
  MERGE (s:Service {name: row.name})
  SET s.tier = row.tier, s.type = row.type, s.tech = row.tech, s.description = row.description`, { rows: data.services });

await run(`UNWIND $rows AS row
  MERGE (p:Person {id: row.id})
  SET p.name = row.name, p.role = row.role`, { rows: data.people });

await run(`UNWIND $rows AS row
  MERGE (i:Incident {id: row.id})
  SET i.title = row.title, i.severity = row.severity, i.startedAt = row.startedAt,
      i.durationMinutes = row.durationMinutes, i.rootCause = row.rootCause`, { rows: data.incidents });

// Relationships.
await run(`UNWIND $rows AS row
  MATCH (t:Team {name: row.owner}), (s:Service {name: row.name})
  MERGE (t)-[:OWNS]->(s)`, { rows: data.services });

await run(`UNWIND $rows AS row
  MATCH (p:Person {id: row.id}), (t:Team {name: row.team})
  MERGE (p)-[:MEMBER_OF]->(t)`, { rows: data.people });

await run(`UNWIND $rows AS row
  MATCH (a:Service {name: row.from}), (b:Service {name: row.to})
  MERGE (a)-[r:DEPENDS_ON]->(b)
  SET r.via = row.via`, { rows: data.dependencies });

await run(`UNWIND $rows AS row
  MATCH (p:Person {id: row.person}), (s:Service {name: row.service})
  MERGE (p)-[w:WORKED_ON]->(s)
  SET w.commits = row.commits, w.lastActive = row.lastActive`, { rows: data.workedOn });

const flat = (key) => data.incidents.flatMap((i) => i[key].map((v) => ({ id: i.id, v })));

await run(`UNWIND $rows AS row
  MATCH (i:Incident {id: row.id}), (s:Service {name: row.originatedIn})
  MERGE (i)-[:ORIGINATED_IN]->(s)`, { rows: data.incidents.map((i) => ({ id: i.id, originatedIn: i.originatedIn })) });

await run(`UNWIND $rows AS row
  MATCH (i:Incident {id: row.id}), (s:Service {name: row.v})
  MERGE (i)-[:AFFECTED]->(s)`, { rows: flat('affected') });

await run(`UNWIND $rows AS row
  MATCH (i:Incident {id: row.id}), (p:Person {id: row.v})
  MERGE (p)-[:RESPONDED_TO]->(i)`, { rows: flat('responders') });

const nodes = (await graph.roQuery('MATCH (n) RETURN count(n) AS c')).data[0].c;
const rels = (await graph.roQuery('MATCH ()-[r]->() RETURN count(r) AS c')).data[0].c;
console.log(`Graph "${GRAPH}": ${nodes} nodes, ${rels} relationships (expected 63 and 262 from the original data)`);
await db.close();
