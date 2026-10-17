// Returns the whole graph (all nodes and relationships) so the canvas can draw it.
// The answer to each question is then highlighted on top of this full picture.
import { connection } from 'next/server';
import { run } from '@/lib/falkor';
import { Q, nodeId, linkId } from '@/lib/queries';

export async function GET() {
  await connection(); // read live data on every request, never a copy cached at build time
  try {
    const [nodeRows, linkRows] = await Promise.all([run(Q.allNodes), run(Q.allLinks)]);

    const nodes = nodeRows.map((r) => ({
      id: nodeId(r.label, r.key),
      label: r.label,
      name: r.props.name ?? r.props.title ?? r.key,
      props: r.props,
    }));

    const links = linkRows.map((r) => {
      const source = nodeId(r.sourceLabel, r.sourceKey);
      const target = nodeId(r.targetLabel, r.targetKey);
      return { id: linkId(source, r.type, target), source, target, type: r.type, props: r.props };
    });

    return Response.json({ nodes, links });
  } catch (err) {
    return Response.json({ error: `Could not read the graph: ${err.message}` }, { status: 500 });
  }
}
