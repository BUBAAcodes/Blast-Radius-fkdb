'use client';
// The graph canvas. It always draws the whole graph; when a question is answered, the part of the
// graph that answer used is lit up (everything else fades), the camera zooms to it, and animated
// dots run along the links that were followed. Click a node or link to see its properties.
import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { COLORS } from '@/lib/colors';

const endId = (end) => (typeof end === 'object' ? end.id : end); // the library swaps ids for objects

export default function GraphView({ graph, highlight, selectedId, onSelect }) {
  const fgRef = useRef(null);
  const boxRef = useRef(null);
  const [size, setSize] = useState({ width: 600, height: 400 });

  // Fit the canvas to its container.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.floor(width), height: Math.floor(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The library mutates the objects it is given, so hand it fresh copies only when the data changes.
  const data = useMemo(
    () => ({
      nodes: graph.nodes.map((n) => ({ ...n })),
      links: graph.links.map((l) => ({ ...l })),
    }),
    [graph],
  );

  const active = highlight.nodes.size > 0;

  // Space nodes out a bit more than the default.
  useEffect(() => {
    fgRef.current?.d3Force('charge')?.strength(-90);
    fgRef.current?.d3Force('link')?.distance(45);
  }, [data]);

  // Zoom to the highlighted part whenever a new answer arrives.
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const t = setTimeout(() => {
      if (active) fg.zoomToFit(700, 70, (n) => highlight.nodes.has(n.id));
      else fg.zoomToFit(700, 40);
    }, 250);
    return () => clearTimeout(t);
  }, [highlight, active]);

  const isLit = (link) => highlight.links.has(link.id);

  return (
    <div ref={boxRef} className="h-full w-full">
      <ForceGraph2D
        ref={fgRef}
        width={size.width}
        height={size.height}
        graphData={data}
        backgroundColor="rgba(0,0,0,0)"
        autoPauseRedraw={false}
        cooldownTicks={120}
        onEngineStop={() => !active && fgRef.current?.zoomToFit(400, 40)}
        nodeRelSize={4}
        nodeVal={(n) => (n.label === 'Service' ? 5 - (n.props.tier ?? 3) : 1.5)}
        nodeLabel={(n) => `${n.label}: ${n.name}`}
        nodeCanvasObjectMode={() => 'replace'}
        nodeCanvasObject={(node, ctx, scale) => {
          const lit = !active || highlight.nodes.has(node.id);
          const focus = highlight.focus === node.id;
          const selected = selectedId === node.id;
          const r = 4 * Math.sqrt(node.label === 'Service' ? 5 - (node.props.tier ?? 3) : 1.5);

          ctx.globalAlpha = lit ? 1 : 0.12;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = COLORS[node.label] ?? '#94a3b8';
          ctx.fill();
          if (focus || selected) {
            ctx.lineWidth = 2 / scale;
            ctx.strokeStyle = selected ? '#ffffff' : '#f8fafc';
            ctx.beginPath();
            ctx.arc(node.x, node.y, r + 3 / scale, 0, 2 * Math.PI);
            ctx.stroke();
          }

          // Names: always for the lit part of an answer, otherwise only when zoomed in.
          if ((active && lit) || scale > 2.2) {
            const fontSize = Math.max(11 / scale, 2);
            ctx.font = `${fontSize}px ui-sans-serif, system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(node.name, node.x, node.y + r + 2 / scale);
          }
          ctx.globalAlpha = 1;
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI);
          ctx.fill();
        }}
        linkColor={(l) => (!active ? 'rgba(148,163,184,0.35)' : isLit(l) ? 'rgba(248,250,252,0.9)' : 'rgba(148,163,184,0.06)')}
        linkWidth={(l) => (isLit(l) ? 2 : selectedId === l.id ? 2 : 0.6)}
        linkDirectionalArrowLength={(l) => (!active || isLit(l) ? 4 : 0)}
        linkDirectionalArrowRelPos={1}
        linkDirectionalParticles={(l) => (isLit(l) ? 2 : 0)}
        linkDirectionalParticleWidth={2.5}
        linkDirectionalParticleSpeed={0.006}
        linkLabel={(l) => `${l.type}  (${endId(l.source).split(':')[1]} → ${endId(l.target).split(':')[1]})`}
        onNodeClick={(n) => onSelect({ kind: 'node', id: n.id })}
        onLinkClick={(l) => onSelect({ kind: 'link', id: l.id })}
        onBackgroundClick={() => onSelect(null)}
      />
    </div>
  );
}
