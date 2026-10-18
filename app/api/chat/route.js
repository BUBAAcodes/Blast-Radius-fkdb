// The agent: the chat page POSTs the question here. streamText sends it to the model with the
// system prompt and tools, runs any tools the model asks for, feeds the results back, and repeats
// until the model writes a final answer (or the step limit is hit). Everything streams to the browser.
// Every question is answered on its own: earlier questions are never sent to the model.
import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { google } from '@ai-sdk/google';
import { tools } from '@/lib/tools';

export const maxDuration = 60; // seconds; a multi-step answer can take a while on Vercel

const SYSTEM = `You are Blast Radius, an incident investigation agent for a microservices company.
You answer questions using a FalkorDB graph and must use the tools for every fact. Never guess
names, owners, counts or incidents.

The graph:
- (Service)-[:DEPENDS_ON]->(Service): the first service needs the second to work
- (Team)-[:OWNS]->(Service), (Person)-[:MEMBER_OF]->(Team)
- (Person)-[:WORKED_ON {commits, lastActive}]->(Service)
- (Incident)-[:ORIGINATED_IN]->(Service) is the root cause; (Incident)-[:AFFECTED]->(Service) is the impact
- Service tier 1 is most critical, tier 3 least

How to work:
- Pick the tool that fits; combine tools for bigger questions. Example: "payments is down, what do
  we do?" -> blastRadius, then serviceContacts for the owners, optionally incidentHistory.
- Only call createIncident when the user asks to open, create or log an incident. Call blastRadius
  first and pass the impacted services as "affected".
- If a tool returns an error with suggestions, ask the user which one they meant.
- Explain answers with the graph path: say which links you followed and how many hops away a
  service is. Put tier 1 impacts first.
- Be concise: a short answer, then bullet points. Mention owning teams and their Slack channels when
  someone needs to act.`;

// Gemini says "429 / RESOURCE_EXHAUSTED" when the free-tier quota is used up. After its retries the
// SDK wraps that in a RetryError, so check the last attempt too.
const QUOTA_RE = /quota|RESOURCE_EXHAUSTED|rate limit|too many requests/i;
function isQuotaError(err) {
  return [err, err?.lastError].some((e) => e?.statusCode === 429 || QUOTA_RE.test(String(e?.message ?? '')));
}

// The text the browser sees for a failed answer. The "QUOTA_EXCEEDED:" prefix lets the chat show a
// friendly "demo limit reached" notice instead of a generic error.
function errorMessage(err) {
  if (isQuotaError(err)) return 'QUOTA_EXCEEDED: The demo has reached its daily AI limit.';
  console.error('chat error:', err);
  return 'The agent could not answer this time. Please try again.';
}

export async function POST(req) {
  const { messages } = await req.json();

  const result = streamText({
    model: google(process.env.GEMINI_MODEL || 'gemini-3.8-flash'),
    system: SYSTEM,
    messages: await convertToModelMessages(messages.slice(-1)), // only the latest question
    tools,
    stopWhen: stepCountIs(6), // at most 6 model calls per question: limits cost and loops
    maxOutputTokens: 1200,
  });

  return result.toUIMessageStreamResponse({ onError: errorMessage });
}
