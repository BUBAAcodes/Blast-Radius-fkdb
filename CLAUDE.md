# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Next.js app ("blast-radius") backed by the [FalkorDB](https://www.falkordb.com/) graph database, using the `falkordb` Node.js client. The graph models services, teams, people and incidents (outages) and the dependencies between services. There is no lint or test setup.

## Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Build / start: `npm run build`, `npm start`
- Seed the graph: `npm run seed` (add or update data), `npm run seed -- --reset` (delete the graph first, then load fresh)

A FalkorDB server on `localhost:6379` is required (e.g. `docker run -p 6379:6379 falkordb/falkordb`).

## Layout

- `app/`: Next.js app router (`layout.js`, `page.js`, `globals.css`).
- `lib/falkor.js`: shared FalkorDB connection for the server. Exports `getGraph()` and `run(cypher, params, { write })`.
- `script.mjs`: standalone seed script that loads `graph-data.json` into FalkorDB.
- `graph-data.json`: seed data (teams, services, people, incidents, dependencies, workedOn).

## Notes

- Configuration comes from env vars, all optional: `FALKORDB_HOST` (default `localhost`), `FALKORDB_PORT` (`6379`), `FALKORDB_TLS` (`true` for encrypted connections, e.g. FalkorDB Cloud), `FALKORDB_USERNAME`, `FALKORDB_PASSWORD`, `FALKORDB_GRAPH` (default `outages`). `lib/falkor.js` and `script.mjs` read the same variables, so they always target the same graph.
- `lib/falkor.js` caches the connection promise on `globalThis` so Next.js dev reloads don't open new connections. Don't create ad-hoc `FalkorDB.connect` calls in app code; use `getGraph()` / `run()`.
- Use `roQuery` (the default in `run()`) for read-only Cypher and `query` (`run(..., { write: true })`) for writes.
- The seed script is idempotent: nodes and relationships use `MERGE`, so re-running won't create duplicates. Use `--reset` for a clean reload.
- After seeding the original data, the graph should have 63 nodes and 262 relationships. The seed script prints the actual counts.
- `package.json` declares `"type": "commonjs"`, but `script.mjs` uses ESM `import` and top-level `await`. The `.mjs` extension is what makes it work; keep standalone ESM scripts as `.mjs`.
