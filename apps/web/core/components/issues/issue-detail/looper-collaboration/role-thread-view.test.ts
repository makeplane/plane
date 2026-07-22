import assert from "node:assert/strict";
import { describe, it } from "node:test";

const roleThreadViewModule = (await import(
  new URL("./role-thread-view.ts", import.meta.url).href
)) as typeof import("./role-thread-view");
const { resolveQuestionOutcome, resolveRoleThreadView } = roleThreadViewModule;

const clientMessageIdModule = (await import(
  new URL("./client-message-id.ts", import.meta.url).href
)) as typeof import("./client-message-id");
const { createClientMessageId } = clientMessageIdModule;

const question = {
  id: "PROD-001",
  question: "How wide is the export scope?",
  context: "Users asked for CSV and PDF.",
  options: [{ id: "A", label: "CSV only", impact: "Ships this week" }],
  recommended_option: "A",
  recommendation_reason: "Smallest slice that unblocks the request",
  design_document_required: false,
};

const humanReply = {
  id: "message-1",
  kind: "human_reply" as const,
  body: "Why not both?",
  delivery_state: "pending" as const,
  evaluation: null,
  actor: { id: "user-1", display_name: "Ada", avatar: null },
  created_at: "2026-07-22T09:00:00Z",
};

const baseRole = {
  questions: [question],
  messages: [],
  conversation_state: "waiting_human" as const,
  remaining_count: 1,
  can_reply: true,
  answer_mode: "quick_decision" as const,
  current_question: "PROD-001 · How wide is the export scope?",
};

describe("resolveRoleThreadView", () => {
  it("keeps a role Looper never asked about collapsed and mute", () => {
    const view = resolveRoleThreadView(
      {
        questions: [],
        messages: [],
        conversation_state: null,
        remaining_count: 0,
        can_reply: false,
        answer_mode: "quick_decision",
        current_question: null,
      },
      "online"
    );

    assert.equal(view.hasThread, false);
    assert.equal(view.status, "idle");
    assert.equal(view.showComposer, false);
    assert.equal(view.showRemaining, false);
  });

  it("hands the composer to the eligible member Looper is waiting on", () => {
    const view = resolveRoleThreadView(baseRole, "online");

    assert.equal(view.hasThread, true);
    assert.equal(view.status, "waiting_human");
    assert.equal(view.waitingOnViewer, true);
    assert.equal(view.showComposer, true);
    assert.equal(view.showRemaining, true);
    assert.equal(view.remainingCount, 1);
  });

  it("shows the thread read-only to everyone else", () => {
    const view = resolveRoleThreadView({ ...baseRole, can_reply: false }, "online");

    assert.equal(view.hasThread, true);
    assert.equal(view.waitingOnViewer, false);
    assert.equal(view.showComposer, false);
  });

  it("reads a queued reply as Looper still thinking", () => {
    const view = resolveRoleThreadView({ ...baseRole, messages: [humanReply] }, "online");

    assert.equal(view.isLooperThinking, true);
    assert.equal(view.showOfflineQueueNotice, false);
  });

  it("explains the queue instead of failing when the node is offline", () => {
    const view = resolveRoleThreadView(
      { ...baseRole, messages: [humanReply], conversation_state: "waiting_looper" },
      "offline"
    );

    assert.equal(view.isLooperThinking, true);
    assert.equal(view.showOfflineQueueNotice, true);
    assert.equal(view.showComposer, false);
  });

  it("closes the composer once Looper converged but keeps the thread", () => {
    const view = resolveRoleThreadView(
      { ...baseRole, conversation_state: "resolved", remaining_count: 0, can_reply: false },
      "online"
    );

    assert.equal(view.hasThread, true);
    assert.equal(view.status, "resolved");
    assert.equal(view.showComposer, false);
    assert.equal(view.showRemaining, false);
  });

  it("keeps the product spec gate visible while the conversation stays open", () => {
    const view = resolveRoleThreadView({ ...baseRole, answer_mode: "formal_product_spec" }, "online");

    assert.equal(view.showSpecGate, true);
    assert.equal(view.showComposer, true);
  });
});

describe("resolveQuestionOutcome", () => {
  it("returns nothing while Looper has not judged the question", () => {
    assert.equal(resolveQuestionOutcome(question, {}), null);
    assert.equal(resolveQuestionOutcome(question, null), null);
  });

  it("matches the outcome by question id", () => {
    const resolution = {
      resolved: false,
      questions: [
        { id: "PROD-002", status: "still_open" as const, answer: "", reason: "" },
        { id: "PROD-001", status: "decided" as const, answer: "CSV only", reason: "Ships sooner" },
      ],
    };

    assert.deepEqual(resolveQuestionOutcome(question, resolution), {
      id: "PROD-001",
      status: "decided",
      answer: "CSV only",
      reason: "Ships sooner",
    });
  });
});

describe("createClientMessageId", () => {
  it("uses the native uuid generator when the browser exposes one", () => {
    const id = createClientMessageId({ randomUUID: () => "11111111-2222-4333-8444-555555555555" });

    assert.equal(id, "11111111-2222-4333-8444-555555555555");
  });

  it("falls back to a valid v4 uuid outside secure contexts", () => {
    const id = createClientMessageId({ getRandomValues: (array) => array });

    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.notEqual(id, createClientMessageId(undefined));
  });
});
