import assert from "node:assert/strict";
import { describe, it } from "node:test";

const roleRequestViewModule = (await import(
  new URL("./role-request-view.ts", import.meta.url).href
)) as typeof import("./role-request-view");
const { resolveRoleRequestView } = roleRequestViewModule;

describe("resolveRoleRequestView", () => {
  it("keeps idle roles compact even when both request ids are null", () => {
    const view = resolveRoleRequestView(
      { open_request_id: null, can_answer: false, answer_mode: "quick_decision" },
      null
    );

    assert.deepEqual(view, {
      showQuestion: false,
      needsProductSpec: false,
      canQuickAnswer: false,
      isAnswering: false,
    });
  });

  it("opens the editor only for the selected answerable request", () => {
    const role = { open_request_id: "request-1", can_answer: true, answer_mode: "quick_decision" } as const;

    assert.equal(resolveRoleRequestView(role, "request-2").isAnswering, false);
    assert.deepEqual(resolveRoleRequestView(role, "request-1"), {
      showQuestion: true,
      needsProductSpec: false,
      canQuickAnswer: true,
      isAnswering: true,
    });
  });

  it("shows restricted questions without offering a quick answer", () => {
    assert.deepEqual(
      resolveRoleRequestView(
        { open_request_id: "request-1", can_answer: false, answer_mode: "quick_decision" },
        "request-1"
      ),
      {
        showQuestion: true,
        needsProductSpec: false,
        canQuickAnswer: false,
        isAnswering: false,
      }
    );
  });

  it("requires a formal product spec instead of an inline answer", () => {
    assert.deepEqual(
      resolveRoleRequestView(
        { open_request_id: "request-1", can_answer: true, answer_mode: "formal_product_spec" },
        "request-1"
      ),
      {
        showQuestion: true,
        needsProductSpec: true,
        canQuickAnswer: false,
        isAnswering: false,
      }
    );
  });
});
