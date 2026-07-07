---
name: trigger-authoring-chat-agent
description: >
  Author and run a durable AI chat agent with chat.agent from @trigger.dev/sdk/ai: the per-turn
  run loop, why you MUST spread ...chat.toStreamTextOptions() first, returning a StreamTextResult
  vs calling chat.pipe(), the two server actions (chat.createStartSessionAction +
  auth.createPublicToken), and wiring useChat to useTriggerChatTransport. Load this when building,
  modifying, or debugging a chat backend (the agent task or its lifecycle hooks) or its React
  transport, when declaring typed tools or custom data parts, or when migrating a plain AI SDK
  streamText route to chat.agent.
type: core
library: trigger.dev
---

# Authoring a chat.agent

The full, version-pinned reference ships **inside your installed `@trigger.dev/sdk`**. Read it before writing code — it always matches the SDK version in this project, so it never drifts:

- **Skill:** `node_modules/@trigger.dev/sdk/skills/trigger-authoring-chat-agent/SKILL.md` — the per-turn run loop, `chat.toStreamTextOptions()`, the two server actions, typed tools/data parts, and the React transport.
- **Docs:** the full, version-pinned docs ship bundled at `node_modules/@trigger.dev/sdk/docs/ai-chat/`; the skill above lists the exact pages it draws from in its `sources:` frontmatter. Grep for an API, e.g. `grep -rl "toStreamTextOptions" node_modules/@trigger.dev/sdk/docs/`.

If those paths don't exist, `@trigger.dev/sdk` isn't installed yet — install it first. In a non-hoisted layout, resolve the package with `node -p "require.resolve('@trigger.dev/sdk/package.json')"` and read `skills/` + `docs/` beside it.

## Common mistakes

- **CRITICAL: forgetting `...chat.toStreamTextOptions()`.**

  ```ts
  // Wrong - compaction / steering / background injection silently no-op
  return streamText({ model, messages, abortSignal: signal });
  // Correct - spread FIRST so explicit overrides win
  return streamText({ ...chat.toStreamTextOptions(), model, messages, abortSignal: signal });
  ```

  It wires the `prepareStep` callback behind compaction, mid-turn steering, and background
  injection, injects the system prompt from `chat.prompt()`, resolves the registry model, and adds
  telemetry. Omitting it makes all of those silently no-op with no error.

- **Declaring tools only on `streamText`.** Also declare them on `chat.agent({ tools })`, read them
  back from `run`, and pass `chat.toStreamTextOptions({ tools })`. Otherwise each tool's
  `toModelOutput` runs on turn 1 but is dropped when history is re-converted on later turns.

- **Not forwarding `signal` for stop.** Without `abortSignal: signal`, Stop updates the UI but the
  model keeps generating server-side.

- **Initializing `chat.local` in `onChatStart`.** Initialize it in `onBoot`. `onChatStart` fires
  once per chat, so continuation runs skip it and crash with
  `chat.local can only be modified after initialization`. `onBoot` fires on every fresh worker.

- **Minting tokens in the browser.** Never expose the environment secret key client-side. Mint via
  the two server actions; the transport calls them.

- **Clearing `lastEventId` on `chat.endRun()`.** Keep the cursor for the Session lifetime; clear it
  only when the Session itself closes. It is sessionId-keyed, so clearing forces a resubscribe from
  `seq_num=0` that can hit the prior turn's stale `turn-complete` and close the stream empty.

- **Returning the raw error from `uiMessageStreamOptions.onError`.** It leaks internals (keys,
  stack traces). Return a sanitized string instead.

## References

Sibling skills: **trigger-chat-agent-advanced** (Sessions primitive, custom transports, sub-agents, HITL, fast starts, resilience, testing, upgrades), **trigger-authoring-tasks** and **trigger-realtime-and-frontend** (the task + frontend foundations chat builds on).
