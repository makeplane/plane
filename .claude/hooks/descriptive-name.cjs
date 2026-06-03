#!/usr/bin/env node

// Crash wrapper
try {
  const { isHookEnabled } = require("./lib/ck-config-utils.cjs");
  const { createHookTimer, logHookCrash } = require("./lib/hook-logger.cjs");

  // Early exit if hook disabled in config
  if (!isHookEnabled("descriptive-name")) {
    process.exit(0);
  }

  try {
    const timer = createHookTimer("descriptive-name", { event: "PreToolUse", tool: "Write" });
    let injectedPrompt = `## File naming guidance:
- Prefer kebab-case for JS/TS/shell (.js, .ts, .sh) with descriptive names
- For Markdown/plain text reports and plans, use the ## Naming path and include workflow + scope in the filename
- Avoid generic report names like red-team-review.md, review.md, report.md, or notes.md
- Respect language conventions: Python/Go/Rust use snake_case (.py, .go, .rs); C#/Java/Kotlin/Swift use PascalCase (.cs, .java, .kt, .swift)
- Other languages: follow their ecosystem's standard naming convention
- Goal: self-documenting names for LLM tools (Grep, Glob, Search)`;

    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "allow",
          additionalContext: injectedPrompt,
        },
      })
    );

    timer.end({ status: "ok", exit: 0 });
    // All paths allowed
    process.exit(0);
  } catch (error) {
    // Fail-open for unexpected errors
    console.error("WARN: Hook error, allowing operation -", error.message);
    logHookCrash("descriptive-name", error, { event: "PreToolUse", tool: "Write" });
    process.exit(0);
  }
} catch (e) {
  try {
    const { logHookCrash } = require("./lib/hook-logger.cjs");
    logHookCrash("descriptive-name", e, { event: "PreToolUse", tool: "Write" });
  } catch (_) {}
  process.exit(0); // fail-open
}
