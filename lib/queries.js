// Every Cypher query the app uses, in one place. All are tested against the seeded data.
// $name, $from, $to, ... are parameters: values are passed separately, never pasted into the string.

export const Q = {
  // Find a service by exact or partial name ("payments" -> "payments-service").
  resolveService: `
    MATCH (s:Service)
    WHERE s.name = $q OR s.name CONTAINS $q
    RETURN s.name AS name
    ORDER BY size(s.name)
    LIMIT 5`,

  // Multi-hop: every service that depends on $name within N hops, with its distance and owner.
  // The hop limit can't be a parameter in Cypher, so it is inserted as a checked integer (1-3).
  blastRadius: (maxHops) => `
    MATCH p = (s:Service)-[:DEPENDS_ON*1..${maxHops}]->(:Service {name: $name})
    WITH s, min(length(p)) AS hops
    OPTIONAL MATCH (team:Team)-[:OWNS]->(s)
    RETURN s.name AS service, s.tier AS tier, hops, team.name AS team
    ORDER BY hops, tier, service`,

  // The DEPENDS_ON links among a set of services, used to draw the highlighted part of the graph.
  dependsOnAmong: `
    MATCH (a:Service)-[:DEPENDS_ON]->(b:Service)
    WHERE a.name IN $names AND b.name IN $names
    RETURN a.name AS source, b.name AS target`,

  // Owning team plus everyone who worked on the service, most commits first.
  serviceContacts: `
    MATCH (s:Service {name: $name})
    OPTIONAL MATCH (t:Team)-[:OWNS]->(s)
    OPTIONAL MATCH (p:Person)-[w:WORKED_ON]->(s)
    RETURN t.name AS team, t.slack AS slack, p.id AS personId, p.name AS person,
           p.role AS role, w.commits AS commits, w.lastActive AS lastActive
    ORDER BY commits DESC`,

  // Past incidents that affected the service, newest first, with each incident's root cause service.
  incidentHistory: `
    MATCH (i:Incident)-[:AFFECTED]->(:Service {name: $name})
    OPTIONAL MATCH (i)-[:ORIGINATED_IN]->(root:Service)
    RETURN i.id AS id, i.severity AS severity, i.startedAt AS startedAt, i.title AS title,
           i.rootCause AS rootCause, i.durationMinutes AS durationMinutes, root.name AS rootService
    ORDER BY startedAt DESC`,

  // Shortest DEPENDS_ON chain from $from to $to.
  // FalkorDB only allows shortestPath inside WITH or RETURN, not directly in MATCH.
  dependencyPath: `
    MATCH (a:Service {name: $from}), (b:Service {name: $to})
    WITH shortestPath((a)-[:DEPENDS_ON*]->(b)) AS p
    RETURN [n IN nodes(p) | n.name] AS path`,

  // Graph algorithm: PageRank over DEPENDS_ON. Services many others rely on score highest.
  criticalServices: `
    CALL algo.pageRank('Service', 'DEPENDS_ON') YIELD node, score
    RETURN node.name AS service, node.tier AS tier, score
    ORDER BY score DESC
    LIMIT $limit`,

  // Action: open a new incident on the root-cause service and return who owns it.
  createIncident: `
    MATCH (s:Service {name: $service})
    CREATE (i:Incident {id: $id, title: $title, severity: $severity, startedAt: $startedAt,
                        durationMinutes: 0, rootCause: 'Under investigation', status: 'open'})
    CREATE (i)-[:ORIGINATED_IN]->(s)
    CREATE (i)-[:AFFECTED]->(s)
    WITH i, s
    OPTIONAL MATCH (t:Team)-[:OWNS]->(s)
    RETURN i.id AS id, t.name AS team, t.slack AS slack`,

  // Link the new incident to the other services it impacts.
  linkAffected: `
    MATCH (i:Incident {id: $id}), (s:Service)
    WHERE s.name IN $names AND NOT (i)-[:AFFECTED]->(s)
    CREATE (i)-[:AFFECTED]->(s)
    RETURN count(s) AS added`,

  // Whole graph for the canvas. Node key = id if it has one, else name.
  allNodes: `
    MATCH (n)
    RETURN labels(n)[0] AS label, coalesce(n.id, n.name) AS key, properties(n) AS props`,

  allLinks: `
    MATCH (a)-[r]->(b)
    RETURN labels(a)[0] AS sourceLabel, coalesce(a.id, a.name) AS sourceKey,
           type(r) AS type, properties(r) AS props,
           labels(b)[0] AS targetLabel, coalesce(b.id, b.name) AS targetKey`,
};

// Node ids used everywhere in the UI: "Service:payments-service", "Team:Payments", "Incident:INC-101".
export const nodeId = (label, key) => `${label}:${key}`;
export const linkId = (source, type, target) => `${source}|${type}|${target}`;