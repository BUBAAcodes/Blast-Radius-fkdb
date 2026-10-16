// One shared FalkorDB connection for the whole server.
// Next.js re-runs modules in dev, so the connection is cached on globalThis.
import { FalkorDB } from 'falkordb';

const cache = globalThis;

async function connect() {
  const host = process.env.FALKORDB_HOST || 'localhost';
  const port = Number(process.env.FALKORDB_PORT || 6379);
  return FalkorDB.connect({
    // FALKORDB_TLS=true is only needed if your FalkorDB Cloud instance requires an encrypted connection.
    ...(process.env.FALKORDB_TLS === 'true' ? { socket: { host, port, tls: true } } : { host, port }),
    username: process.env.FALKORDB_USERNAME || undefined,
    password: process.env.FALKORDB_PASSWORD || undefined,
  });
}

export async function getGraph() {
  if (!cache.__falkordb) {
    cache.__falkordb = connect().catch((err) => {
      cache.__falkordb = undefined; // try again on the next request
      throw err;
    });
  }
  const db = await cache.__falkordb;
  return db.selectGraph(process.env.FALKORDB_GRAPH || 'outages');
}

// Runs a Cypher query and returns plain rows, e.g. [{ service: 'checkout-service', hops: 1 }].
// Reads use roQuery (read-only), so a read tool can never change data by accident.
export async function run(cypher, params = {}, { write = false } = {}) {
  const graph = await getGraph();
  const result = write
    ? await graph.query(cypher, { params })
    : await graph.roQuery(cypher, { params });
  return result.data ?? [];
}
