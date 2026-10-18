// Past questions, kept in this browser only (localStorage), so every visitor has their own list.
// One entry is one question plus its answer, stored as the useChat messages so it can be shown
// again exactly as it was, tool results and graph highlight included.
const KEY = 'blast-radius:history';
const MAX_ENTRIES = 30; // oldest entries are dropped past this, to stay well under the storage quota

export function loadHistory() {
  try {
    const entries = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(entries) ? entries : [];
  } catch {
    return []; // blocked storage or a corrupt value: start with an empty list
  }
}

export function saveHistory(entries) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // Storage is full or blocked (e.g. a private window): the chat still works, it just isn't kept.
  }
}

export const newEntryId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const questionOf = (messages) =>
  messages.find((m) => m.role === 'user')?.parts.filter((p) => p.type === 'text').map((p) => p.text).join('') ?? '';
