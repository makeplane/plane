#!/usr/bin/env node
'use strict';

/**
 * Transcript Parser - Extract tool/agent/todo state from session JSONL
 * @module transcript-parser
 */

const fs = require('fs');
const readline = require('readline');

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
  result.todos = latestTodos;

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
          latestTodos.push(...block.input.todos);
        }
      } else if (block.name === 'TaskCreate') {
        // Native Task API: Add new task
        if (block.input?.subject) {
          latestTodos.push({
            content: block.input.subject,
            status: 'pending',
            activeForm: block.input.activeForm || null
          });
        }
      } else if (block.name === 'TaskUpdate') {
        // Native Task API: Update existing task status
        if (block.input?.taskId && block.input?.status) {
          const task = latestTodos.find(t => t.id === block.input.taskId);
          if (task) {
            task.status = block.input.status;
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
