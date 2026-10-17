# Blast Radius: setup

Drop-in files for a fresh `create-next-app` project (JavaScript, Tailwind, App Router).

## 1. Create the project and add the files

```bash
npx create-next-app@latest blast-radius     # No to recommended defaults, then: TypeScript No, linter None, Tailwind Yes, App Router Yes, alias No
cd blast-radius
npm install falkordb ai @ai-sdk/react @ai-sdk/google zod react-force-graph-2d
```

Unzip this folder into the project root. It replaces `app/page.js` and adds `app/api/`, `components/`, `lib/`, `scripts/`, `data/` and `.env.example`.

## 2. Two small edits

In `next.config.mjs`, add one line inside `nextConfig` (keep everything else):

```js
serverExternalPackages: ['falkordb'],
```

In `package.json`, add to `"scripts"`:

```json
"seed": "node --env-file=.env.local scripts/seed.mjs"
```

## 3. Environment

```bash
cp .env.example .env.local
```

Put your Gemini key in `GOOGLE_GENERATIVE_AI_API_KEY`. Check `.gitignore` contains `.env*`.

## 4. Load the data and run

With FalkorDB running in Docker:

```bash
npm run seed -- --reset    # should print 63 nodes, 262 relationships
npm run dev
```

Open http://localhost:3000 (if FalkorDB Browser already uses 3000, Next picks 3001).

## How the pieces connect

```
Browser (components/AgentApp.js)
  useChat ── POST /api/chat ──> app/api/chat/route.js
                                  streamText(model + system prompt + tools, max 6 steps)
                                    │ model picks a tool
                                    ▼
                                lib/tools.js  ── run(Cypher) ──> lib/falkor.js ──> FalkorDB
                                    │ returns { summary, rows, cypher, highlight }
                                    ▼
                                model reads the result, maybe calls more tools, writes the answer
  <── streamed text + "tool-<name>" parts ──
  tool parts ──> highlight on the graph (components/GraphView.js)
             └─> evidence list (components/DetailsPanel.js)
  GET /api/graph (whole graph, once) ──> app/api/graph/route.js
```

| File | What it does |
|---|---|
| `lib/queries.js` | Every Cypher query, tested against the data |
| `lib/tools.js` | 6 agent tools: blastRadius, serviceContacts, incidentHistory, dependencyPath, criticalServices (PageRank), createIncident (action) |
| `app/api/chat/route.js` | The agent: system prompt, model, tools, step limit |
| `app/api/graph/route.js` | Returns all nodes and links for the canvas |
| `components/AgentApp.js` | Chat, example questions, collects tool results into the highlight |
| `components/GraphView.js` | Canvas: fades everything except the answer, zooms to it, animates followed links |
| `components/DetailsPanel.js` | Properties of the clicked node or link, plus tools run and their Cypher |
| `scripts/seed.mjs` | Loads `data/graph-data.json` with MERGE; safe to re-run |

## Deploying later (Day 3)

Set the same variables in Vercel (FalkorDB Cloud host, port, username, password; Gemini key). Run `npm run seed -- --reset` once against the Cloud instance from your laptop by pointing `.env.local` at it. Set `ALLOW_WRITES=false` if you don't want visitors creating incidents.
