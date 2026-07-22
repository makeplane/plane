import type {
  TLooperQuestion,
  TLooperQuestionOutcome,
  TLooperResolution,
  TLooperRoleMessage,
  TLooperRoleSummary,
} from "./types";

/** What the row badge says. `idle` means Looper never asked this role anything. */
export type TLooperThreadStatus = "idle" | "waiting_human" | "waiting_looper" | "resolved" | "failed";

export type TRoleThreadView = {
  /** A role only expands into a thread once Looper actually asked something. */
  hasThread: boolean;
  status: TLooperThreadStatus;
  /** True while the viewer is the one Looper is waiting on. */
  waitingOnViewer: boolean;
  /** Looper is chewing on the latest reply — either it said so, or a reply is still queued. */
  isLooperThinking: boolean;
  remainingCount: number;
  showRemaining: boolean;
  /** The composer belongs to the eligible member of an open request, and nobody else. */
  showComposer: boolean;
  /** A formal product spec is never unblocked by the conversation, only by the linked page. */
  showSpecGate: boolean;
  /** A queued reply plus a Node that is not online: say it is queued, not broken. */
  showOfflineQueueNotice: boolean;
};

type TRoleThreadInput = Pick<
  TLooperRoleSummary,
  "questions" | "messages" | "conversation_state" | "remaining_count" | "can_reply" | "answer_mode"
> &
  Partial<Pick<TLooperRoleSummary, "current_question">>;

type TNodeLiveStatus = "online" | "offline" | "stale" | "unavailable";

function hasQueuedReply(messages: TLooperRoleMessage[]): boolean {
  return messages.some((message) => message.kind === "human_reply" && message.delivery_state === "pending");
}

/**
 * Decides how one role row renders. Everything here is derived from the summary alone so the
 * thread never disagrees with the backend about who may reply or whether the gate still holds.
 */
export function resolveRoleThreadView(role: TRoleThreadInput, nodeLiveStatus: TNodeLiveStatus): TRoleThreadView {
  const questions = role.questions ?? [];
  const messages = role.messages ?? [];
  const hasThread = questions.length > 0 || messages.length > 0 || !!role.current_question;
  const queuedReply = hasQueuedReply(messages);
  const status: TLooperThreadStatus = hasThread ? (role.conversation_state ?? "waiting_human") : "idle";
  const isLooperThinking = hasThread && (status === "waiting_looper" || queuedReply);
  const remainingCount = Math.max(0, role.remaining_count ?? 0);

  return {
    hasThread,
    status,
    waitingOnViewer: status === "waiting_human" && role.can_reply,
    isLooperThinking,
    remainingCount,
    showRemaining: hasThread && status !== "resolved" && remainingCount > 0,
    showComposer: hasThread && role.can_reply && !isLooperThinking && status !== "resolved",
    showSpecGate: hasThread && role.answer_mode === "formal_product_spec",
    showOfflineQueueNotice: queuedReply && nodeLiveStatus !== "online",
  };
}

/** Looper reports a per-question verdict; without one the question is simply still open. */
export function resolveQuestionOutcome(
  question: Pick<TLooperQuestion, "id">,
  resolution: TLooperResolution | null | undefined
): TLooperQuestionOutcome | null {
  const outcomes = resolution?.questions ?? [];
  return outcomes.find((outcome) => outcome.id === question.id) ?? null;
}
