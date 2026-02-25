import type { Plugin } from "@opencode-ai/plugin";

const { buildReminderContext } = require("./lib/context-builder.cjs");
const { detectProject, getCodingLevelGuidelines } = require("./lib/project-detector.cjs");
const { loadConfig } = require("./lib/ck-config-utils.cjs");

// Track first message per session to inject context once
const injectedSessions = new Set<string>();

/**
 * Context Injector Plugin - Inject session context into first message
 *
 * Combines functionality of dev-rules-reminder.cjs and session-init.cjs.
 * Injects rules, session info, project detection into first user message only.
 */
export const ContextInjectorPlugin: Plugin = async ({ directory }) => {
  // Load config once at plugin initialization
  let config: any;
  let detections: any;

  try {
    config = loadConfig();
    detections = detectProject();
  } catch (e) {
    // Fallback to defaults if config loading fails
    config = { codingLevel: -1 };
    detections = {};
  }

  return {
    "chat.message": async ({}: any, { message }: any) => {
      // Get or generate session ID
      const sessionId = process.env.OPENCODE_SESSION_ID ||
                        `opencode-${Date.now()}`;

      // Only inject on first message per session
      if (injectedSessions.has(sessionId)) {
        return;
      }
      injectedSessions.add(sessionId);

      try {
        // Build context
        const { content } = buildReminderContext({
          sessionId,
          config,
          staticEnv: {
            nodeVersion: process.version,
            osPlatform: process.platform,
            gitBranch: detections.gitBranch,
            gitRoot: detections.gitRoot,
            user: process.env.USER || process.env.USERNAME,
            locale: process.env.LANG || '',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          configDirName: '.opencode'
        });

        // Inject coding level guidelines if configured
        const codingLevel = config.codingLevel ?? -1;
        const guidelines = getCodingLevelGuidelines(codingLevel, `${directory}/.opencode`);

        // Prepend context to first user message
        const contextBlock = [
          '<system-context>',
          content,
          guidelines ? `\n${guidelines}` : '',
          '</system-context>',
          ''
        ].filter(Boolean).join('\n');

        // Modify message content (prepend context)
        if (message && typeof message.content === 'string') {
          message.content = contextBlock + message.content;
        }
      } catch (e) {
        // Silently fail - don't break the chat if context injection fails
        console.error('[ContextInjector] Failed to inject context:', e);
      }
    }
  };
};

export default ContextInjectorPlugin;
