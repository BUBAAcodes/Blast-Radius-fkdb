import { tools } from '../lib/tools.js';

const show = (label, r) => {
  console.log(`\n=== ${label} ===`);
  console.log(r.error ? r : { summary: r.summary, rows: r.rows.length, focus: r.focus, nodes: r.highlight.nodes.length, links: r.highlight.links.length });
};

show('blastRadius', await tools.blastRadius.execute({ service: 'payments', maxHops: 3 }));
show('serviceContacts', await tools.serviceContacts.execute({ service: 'payments' }));
show('incidentHistory', await tools.incidentHistory.execute({ service: 'payments' }));
show('dependencyPath', await tools.dependencyPath.execute({ from: 'web-app', to: 'user-db' }));
show('criticalServices', await tools.criticalServices.execute({ limit: 5 }));
show('bad name', await tools.blastRadius.execute({ service: 'zzz' }));
process.exit(0);
