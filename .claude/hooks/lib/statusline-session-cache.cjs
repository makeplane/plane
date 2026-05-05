'use strict';

const MAX_AGENTS = 10;

function toIsoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeTodo(todo) {
  if (!todo || typeof todo !== 'object') return null;
  const normalized = {
    content: typeof todo.content === 'string' ? todo.content : '',
    status: typeof todo.status === 'string' ? todo.status : 'pending',
    activeForm: typeof todo.activeForm === 'string' ? todo.activeForm : null
  };
  if (todo.id != null) normalized.id = String(todo.id);
  return normalized;
}

function normalizeAgent(agent) {
  if (!agent || typeof agent !== 'object') return null;
  return {
    id: agent.id != null ? String(agent.id) : null,
    type: typeof agent.type === 'string' ? agent.type : 'unknown',
    model: typeof agent.model === 'string' ? agent.model : null,
    description: typeof agent.description === 'string' ? agent.description : null,
    status: agent.status === 'completed' ? 'completed' : 'running',
    startTime: toIsoOrNull(agent.startTime),
    endTime: toIsoOrNull(agent.endTime)
  };
}

function createEmptyActivitySnapshot(now = new Date().toISOString()) {
  return {
    sessionStart: now,
    updatedAt: now,
    warmed: false,
    agents: [],
    todos: []
  };
}

function sanitizeActivitySnapshot(snapshot) {
  const now = new Date().toISOString();
  if (!snapshot || typeof snapshot !== 'object') {
    return createEmptyActivitySnapshot(now);
  }

  const agents = Array.isArray(snapshot.agents)
    ? snapshot.agents.map(normalizeAgent).filter(Boolean).slice(-MAX_AGENTS)
    : [];
  const todos = Array.isArray(snapshot.todos)
    ? snapshot.todos.map(normalizeTodo).filter(Boolean)
    : [];

  return {
    sessionStart: toIsoOrNull(snapshot.sessionStart) || now,
    updatedAt: toIsoOrNull(snapshot.updatedAt) || now,
    warmed: Boolean(snapshot.warmed),
    agents,
    todos
  };
}

function readActivitySnapshot(sessionId, readSessionState) {
  if (!sessionId) return null;
  const state = readSessionState(sessionId);
  if (!state || !state.statusline) return null;
  return sanitizeActivitySnapshot(state.statusline);
}

function writeActivitySnapshot(sessionId, snapshot, updateSessionState) {
  if (!sessionId) return false;
  const sanitized = sanitizeActivitySnapshot({
    ...snapshot,
    updatedAt: new Date().toISOString(),
    warmed: snapshot?.warmed !== false
  });

  return updateSessionState(sessionId, state => ({
    ...state,
    statusline: sanitized
  }));
}

module.exports = {
  createEmptyActivitySnapshot,
  sanitizeActivitySnapshot,
  readActivitySnapshot,
  writeActivitySnapshot
};
