#!/usr/bin/env node
'use strict';

/**
 * Transcript Parser - Extract tool/agent/todo state from session JSONL
 * @module transcript-parser
 */

const fs = require('fs');
const readline = require('readline');

function isNativeTaskTodo(todo) {
  return Boolean(todo && todo._source === 'native_task');
}

function normalizeTodo(todo) {
  if (!todo || typeof todo !== 'object') return null;
  const normalized = {
    content: todo.content ?? '',
    status: todo.status ?? 'pending',
    activeForm: todo.activeForm ?? null
  };
  if (todo.id != null) normalized.id = todo.id;
  return normalized;
}

function extractTaskIdFromString(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    return extractTaskIdFromValue(parsed);
  } catch {
    // Not JSON, continue with regex extraction.
  }

  const match = trimmed.match(/["']?task[_-]?id["']?\s*[:=]\s*["']([^"']+)["']/i);
  if (match && match[1]) return match[1];
  return null;
}

function extractTaskIdFromValue(value) {
  if (value == null) return null;

  if (typeof value === 'string') {
    return extractTaskIdFromString(value);
  }

  if (typeof value !== 'object') return null;

  if (typeof value.taskId === 'string' || typeof value.taskId === 'number') {
    return String(value.taskId);
  }
  if (typeof value.task_id === 'string' || typeof value.task_id === 'number') {
    return String(value.task_id);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const taskId = extractTaskIdFromValue(item);
      if (taskId) return taskId;
    }
    return null;
  }

  for (const fieldValue of Object.values(value)) {
    const taskId = extractTaskIdFromValue(fieldValue);
    if (taskId) return taskId;
  }
  return null;
}

/**
 * Parse transcript JSONL file
 * @param {string} transcriptPath - Path to transcript file
 * @returns {Promise<TranscriptData>}
 */
async function parseTranscript(transcriptPath) {
  const result = {
    tools: [],
    agents: [],
    todos: [],
    sessionStart: null
  };

  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    return result;
  }

  const toolMap = new Map();
  const agentMap = new Map();
  let latestTodos = [];

  try {
    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line);
        processEntry(entry, toolMap, agentMap, latestTodos, result);
      } catch {
        // Skip malformed lines
      }
    }
  } catch {
    // Return partial results on error
  }

  result.tools = Array.from(toolMap.values()).slice(-20);
  result.agents = Array.from(agentMap.values()).slice(-10);
  result.todos = latestTodos
    .map(normalizeTodo)
    .filter(Boolean);

  return result;
}

/**
 * Process single JSONL entry
 * @param {Object} entry - Parsed JSON line
 * @param {Map} toolMap - Tool tracking map
 * @param {Map} agentMap - Agent tracking map
 * @param {Array} latestTodos - Latest todo array reference
 * @param {Object} result - Result object
 */
function processEntry(entry, toolMap, agentMap, latestTodos, result) {
  const timestamp = entry.timestamp ? new Date(entry.timestamp) : new Date();

  // Track session start
  if (!result.sessionStart && entry.timestamp) {
    result.sessionStart = timestamp;
  }

  const content = entry.message?.content;
  if (!content || !Array.isArray(content)) return;

  for (const block of content) {
    // Handle tool_use blocks
    if (block.type === 'tool_use' && block.id && block.name) {
      if (block.name === 'Task') {
        // Agent spawn
        agentMap.set(block.id, {
          id: block.id,
          type: block.input?.subagent_type ?? 'unknown',
          model: block.input?.model ?? null,
          description: block.input?.description ?? null,
          status: 'running',
          startTime: timestamp,
          endTime: null
        });
      } else if (block.name === 'TodoWrite') {
        // Legacy: Replace todo array (deprecated, kept for backwards compatibility)
        if (block.input?.todos && Array.isArray(block.input.todos)) {
          latestTodos.length = 0;
          latestTodos.push(
            ...block.input.todos.map(todo => ({
              ...todo,
              _source: 'legacy_todowrite'
            }))
          );
        }
      } else if (block.name === 'TaskCreate') {
        // Native Task API: add new task.
        // Track by tool_use id first; hydrate real task id from matching tool_result when present.
        if (block.input?.subject) {
          latestTodos.push({
            id: block.id,
            content: block.input.subject,
            status: 'pending',
            activeForm: block.input.activeForm || null,
            _source: 'native_task',
            _toolUseId: block.id
          });
        }
      } else if (block.name === 'TaskUpdate') {
        // Native Task API: Update existing task status
        // Match by taskId against native-task ids first.
        // Numeric fallback maps to native-task creation order only (not legacy TodoWrite items).
        if (block.input?.taskId && block.input?.status) {
          const taskId = String(block.input.taskId);
          const nativeTodos = latestTodos.filter(isNativeTaskTodo);
          let task = nativeTodos.find(t => String(t.id) === taskId);
          if (!task && /^\d+$/.test(taskId)) {
            const idx = Number(taskId) - 1;
            if (idx >= 0 && idx < nativeTodos.length) task = nativeTodos[idx];
          }

          if (task) {
            task.status = block.input.status;
            if (Object.prototype.hasOwnProperty.call(block.input, 'activeForm')) {
              task.activeForm = block.input.activeForm || null;
            }
          }
        }
      } else {
        // Regular tool
        toolMap.set(block.id, {
          id: block.id,
          name: block.name,
          target: extractTarget(block.name, block.input),
          status: 'running',
          startTime: timestamp,
          endTime: null
        });
      }
    }

    // Handle tool_result blocks
    if (block.type === 'tool_result' && block.tool_use_id) {
      const tool = toolMap.get(block.tool_use_id);
      if (tool) {
        tool.status = block.is_error ? 'error' : 'completed';
        tool.endTime = timestamp;
      }

      const agent = agentMap.get(block.tool_use_id);
      if (agent) {
        agent.status = 'completed';
        agent.endTime = timestamp;
      }

      const createdTask = latestTodos.find(
        todo => isNativeTaskTodo(todo) && todo._toolUseId === block.tool_use_id
      );
      if (createdTask) {
        const hydratedId = extractTaskIdFromValue(block.content);
        if (hydratedId) {
          createdTask.id = hydratedId;
        }
      }
    }
  }
}

/**
 * Extract target from tool input
 * @param {string} toolName - Tool name
 * @param {Object} input - Tool input object
 * @returns {string|null} - Extracted target
 */
function extractTarget(toolName, input) {
  if (!input) return null;

  switch (toolName) {
    case 'Read':
    case 'Write':
    case 'Edit':
      return input.file_path ?? input.path ?? null;

    case 'Glob':
    case 'Grep':
      return input.pattern ?? null;

    case 'Bash':
      const cmd = input.command;
      if (!cmd) return null;
      return cmd.length > 30 ? cmd.slice(0, 30) + '...' : cmd;

    default:
      return null;
  }
}

module.exports = {
  parseTranscript,
  // Export for testing
  processEntry,
  extractTarget
};
