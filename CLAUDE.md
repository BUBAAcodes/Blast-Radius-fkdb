# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A small practice project for the [FalkorDB](https://www.falkordb.com/) graph database using the `falkordb` Node.js client. All code lives in a single script, `script.mjs`. There is no build, lint, or test setup (`npm test` is a placeholder that exits 1).

## Commands

- Install: `npm install`
- Run: `node script.mjs`

Running requires a FalkorDB server on `localhost:6379` (e.g. `docker run -p 6379:6379 falkordb/falkordb`).

## Notes

- `package.json` declares `"type": "commonjs"`, but `script.mjs` uses ESM `import` and top-level `await`. The `.mjs` extension is what makes it work; keep new ESM scripts as `.mjs`.
- The script uses the graph named `practice`, which is meant to match the graph viewed in the FalkorDB browser UI. Keep the name the same if you want to inspect results there.
- `script.mjs` runs a `CREATE` on every execution, so re-running it adds duplicate `Service` nodes and edges to the `practice` graph. Delete the graph first (e.g. `graph.delete()`) or use `MERGE` if you need idempotent runs.
- Use `graph.roQuery` for read-only Cypher and `graph.query` for writes.
