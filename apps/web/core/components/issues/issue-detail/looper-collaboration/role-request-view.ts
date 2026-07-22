import type { TLooperSummary } from "./types";

type TLooperRoleSummary = NonNullable<TLooperSummary["roles"]>[number];

export type TRoleRequestView = {
  /** The question card only exists while the role has an open request. */
  showQuestion: boolean;
  /** A formal product spec cannot be settled with an inline answer. */
  needsProductSpec: boolean;
  /** The answer button, and therefore the inline answer form, is opt-in per role. */
  canQuickAnswer: boolean;
  /** True only for the role whose own open request is being answered right now. */
  isAnswering: boolean;
};

/**
 * Decides what a single role row renders. Roles without an open request stay a compact row:
 * comparing `answeringRequest` to a null `open_request_id` used to match every idle role at once.
 */
export function resolveRoleRequestView(
  role: Pick<TLooperRoleSummary, "open_request_id" | "can_answer" | "answer_mode">,
  answeringRequestId: string | null
): TRoleRequestView {
  const hasOpenRequest = !!role.open_request_id;
  const needsProductSpec = role.answer_mode === "formal_product_spec";
  const canQuickAnswer = hasOpenRequest && role.can_answer && !needsProductSpec;

  return {
    showQuestion: hasOpenRequest,
    needsProductSpec: hasOpenRequest && needsProductSpec,
    canQuickAnswer,
    isAnswering: canQuickAnswer && role.open_request_id === answeringRequestId,
  };
}
