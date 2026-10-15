
import { FalkorDB } from 'falkordb';

const db = await FalkorDB.connect({
  host: 'localhost',
  port: 6379,
});

// Use the SAME graph name as your browser: practice
const graph = db.selectGraph('practice');

try {
  // Create services and their dependencies
  await graph.query(`
    CREATE
      (:Service {name: 'frontend'})-[:DEPENDS_ON]->(:Service {name: 'auth'}),
      (:Service {name: 'payments'})-[:DEPENDS_ON]->(:Service {name: 'auth'}),
      (:Service {name: 'orders'})-[:DEPENDS_ON]->(:Service {name: 'payments'}),
      (:Service {name: 'notifications'})-[:DEPENDS_ON]->(:Service {name: 'auth'}),
      (:Service {name: 'analytics'})-[:DEPENDS_ON]->(:Service {name: 'auth'})
  `);

  // Read all nodes and relationships
  const result = await graph.roQuery(`
    MATCH (a)-[r]->(b)
    RETURN a.name AS source, type(r) AS relationship, b.name AS target
  `);

  console.log(result);
} catch (error) {
  console.error('FalkorDB error:', error);
} finally {
  await db.close();
}
