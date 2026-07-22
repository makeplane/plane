import { useEffect, useState } from "react";
import { Bot, ChevronDown, FileText, Link2 } from "lucide-react";

import { useTranslation } from "@plane/i18n";
import { Badge } from "@plane/propel/badge";
import { Button } from "@plane/propel/button";
import { cn } from "@plane/utils";

import { resolveQuestionOutcome, resolveRoleThreadView } from "./role-thread-view";
import type { TLooperQuestion, TLooperRole, TLooperRoleMessage, TLooperRoleSummary } from "./types";

/** The link title Looper watches for; a plain comment never lifts the spec gate. */
export const PRODUCT_SPEC_LINK_TITLE = "looper:product-spec";

type TNodeLiveStatus = "online" | "offline" | "stale" | "unavailable";

type Props = {
  role: TLooperRoleSummary;
  nodeLiveStatus: TNodeLiveStatus;
  onReply: (roleRequestId: string, message: string) => Promise<boolean>;
  onLinkProductSpec: () => void;
};

const ROLE_ACCENT: Record<TLooperRole, string> = {
  product: "bg-accent-primary",
  design: "bg-warning-primary",
  engineering: "bg-success-primary",
  qa: "bg-tertiary",
};

const OUTCOME_BADGE = {
  decided: "success",
  delegated: "brand",
  still_open: "warning",
} as const;

function formatTime(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleString();
}

function QuestionCard({
  question,
  outcome,
}: {
  question: TLooperQuestion;
  outcome: ReturnType<typeof resolveQuestionOutcome>;
}) {
  const { t } = useTranslation();

  return (
    <div className="rounded-md border border-subtle bg-surface-1 px-2.5 py-2">
      <div className="flex flex-wrap items-start gap-x-1.5 gap-y-1">
        <span className="text-caption-sm-medium text-tertiary">{question.id}</span>
        <p className="min-w-0 grow text-body-xs-medium text-primary">{question.question}</p>
        {outcome && (
          <Badge variant={OUTCOME_BADGE[outcome.status]} size="sm">
            {t(`issue.looper.thread.question_status.${outcome.status}`)}
          </Badge>
        )}
      </div>

      {question.context && <p className="mt-1 text-caption-md-regular text-secondary">{question.context}</p>}

      {question.design_document_required && (
        <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-layer-3 px-1.5 py-0.5 text-caption-sm-regular text-tertiary">
          <FileText className="size-3" />
          {t("issue.looper.thread.design_document_required")}
        </div>
      )}

      {question.options.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {question.options.map((option) => {
            const isRecommended = !!question.recommended_option && option.id === question.recommended_option;
            return (
              <li key={option.id} className="flex flex-wrap items-baseline gap-x-1.5 text-caption-md-regular">
                <span className={cn("text-caption-sm-medium text-tertiary", isRecommended && "text-accent-primary")}>
                  {option.id}
                </span>
                <span className="min-w-0 text-secondary">
                  {option.label}
                  {option.impact ? ` · ${option.impact}` : ""}
                </span>
                {isRecommended && (
                  <Badge variant="brand" size="sm">
                    {t("issue.looper.thread.recommended")}
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {question.recommended_option && question.recommendation_reason && (
        <p className="mt-1 text-caption-md-regular text-tertiary">
          {t("issue.looper.thread.recommendation_reason", {
            option: question.recommended_option,
            reason: question.recommendation_reason,
          })}
        </p>
      )}

      {outcome?.answer && (
        <p className="mt-1.5 text-caption-md-regular text-secondary">
          <span className="text-caption-sm-medium text-primary">{t("issue.looper.thread.outcome_answer")}</span>{" "}
          {outcome.answer}
        </p>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: TLooperRoleMessage }) {
  const { t } = useTranslation();
  const isLooper = message.kind === "looper_reply";

  return (
    <li
      className={cn(
        "rounded-md border px-2.5 py-1.5",
        isLooper ? "border-subtle bg-surface-1" : "border-accent-subtle bg-accent-subtle"
      )}
    >
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-caption-sm-regular text-tertiary">
        {isLooper && <Bot className="size-3 text-accent-primary" />}
        <span className="text-secondary">
          {isLooper ? t("issue.looper.thread.looper") : (message.actor?.display_name ?? t("issue.looper.unassigned"))}
        </span>
        <span suppressHydrationWarning>{formatTime(message.created_at)}</span>
        {message.delivery_state === "pending" && (
          <span className="ml-auto">{t("issue.looper.thread.delivery.pending")}</span>
        )}
        {message.delivery_state === "failed" && (
          <span className="ml-auto text-warning-primary">{t("issue.looper.thread.delivery.failed")}</span>
        )}
      </div>
      <p className="mt-0.5 text-body-xs-regular break-words whitespace-pre-wrap text-primary">{message.body}</p>
    </li>
  );
}

export function LooperRoleThread(props: Props) {
  const { role, nodeLiveStatus, onReply, onLinkProductSpec } = props;
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Bridges the gap between a successful post and the refreshed summary. */
  const [justReplied, setJustReplied] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(role.conversation_state !== "resolved");

  const view = resolveRoleThreadView(role, nodeLiveStatus);
  const isNodeOffline = nodeLiveStatus !== "online";
  const isLooperThinking = view.isLooperThinking || justReplied;
  const showComposer = view.showComposer && !justReplied;

  useEffect(() => {
    setJustReplied(false);
  }, [role.conversation_state, role.messages.length]);

  const submitReply = async () => {
    const message = draft.trim();
    if (!role.open_request_id || !message || isSubmitting) return;
    setIsSubmitting(true);
    const succeeded = await onReply(role.open_request_id, message);
    if (succeeded) {
      setDraft("");
      setJustReplied(true);
    }
    setIsSubmitting(false);
  };

  const copySpecTitle = async () => {
    try {
      await navigator.clipboard.writeText(PRODUCT_SPEC_LINK_TITLE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const statusBadge = (() => {
    if (isLooperThinking) return { variant: "brand" as const, label: t("issue.looper.thread.status.waiting_looper") };
    if (view.status === "resolved")
      return { variant: "success" as const, label: t("issue.looper.thread.status.resolved") };
    if (view.status === "failed") return { variant: "danger" as const, label: t("issue.looper.thread.status.failed") };
    if (view.status === "waiting_human")
      return {
        variant: "warning" as const,
        label: view.waitingOnViewer
          ? t("issue.looper.thread.status.waiting_you")
          : t("issue.looper.thread.status.waiting_owner"),
      };
    if (role.status === "completed")
      return {
        variant: "success" as const,
        label: t("issue.looper.answered_count", { answered: role.answered_count, total: role.total_count }),
      };
    return { variant: "neutral" as const, label: t("issue.looper.pending") };
  })();

  return (
    <div className="px-2.5 py-1.5">
      <button
        type="button"
        disabled={!view.hasThread}
        aria-expanded={view.hasThread ? isExpanded : undefined}
        onClick={() => setIsExpanded((value) => !value)}
        className="flex min-h-9 w-full flex-wrap items-center gap-2 text-left disabled:cursor-default"
      >
        <span className={cn("h-4 w-0.5 rounded-full", ROLE_ACCENT[role.role])} />
        <span className="min-w-24 text-body-xs-medium text-primary">{t(`issue.looper.role.${role.role}`)}</span>
        <span className="min-w-0 grow truncate text-caption-md-regular text-tertiary">
          {role.member?.display_name ?? t("issue.looper.unassigned")}
        </span>
        {view.showRemaining && (
          <span className="text-caption-sm-regular text-tertiary">
            {t("issue.looper.thread.remaining", { count: view.remainingCount })}
          </span>
        )}
        <Badge variant={statusBadge.variant} size="sm">
          {statusBadge.label}
        </Badge>
        {view.hasThread && (
          <ChevronDown className={cn("size-3.5 text-tertiary transition-transform", isExpanded && "rotate-180")} />
        )}
      </button>

      {view.hasThread && isExpanded && (
        <div className="mt-1 mb-1.5 space-y-2 rounded-md border border-subtle bg-layer-1 px-2.5 py-2">
          <div className="text-caption-sm-regular text-tertiary">{t("issue.looper.thread.questions_heading")}</div>

          {role.questions.length > 0 ? (
            role.questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                outcome={resolveQuestionOutcome(question, role.resolution)}
              />
            ))
          ) : (
            <p className="text-body-xs-regular text-primary">{role.current_question}</p>
          )}

          {view.showSpecGate && (
            <div className="rounded-md border border-subtle bg-surface-1 px-2.5 py-2">
              <div className="flex items-start gap-1.5">
                <FileText className="mt-0.5 size-3.5 shrink-0 text-tertiary" />
                <div className="min-w-0">
                  <div className="text-caption-sm-medium text-primary">
                    {t("issue.looper.answer_mode.formal_product_spec")}
                  </div>
                  <p className="mt-0.5 text-caption-md-regular text-secondary">
                    {t("issue.looper.thread.spec_gate.body", { title: PRODUCT_SPEC_LINK_TITLE })}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={onLinkProductSpec}>
                      <Link2 className="size-3.5" aria-hidden="true" />
                      {t("issue.looper.thread.spec_gate.cta")}
                    </Button>
                    <button
                      type="button"
                      onClick={() => void copySpecTitle()}
                      className="h-7 rounded-md px-1.5 text-caption-sm-regular text-tertiary hover:bg-layer-3 hover:text-secondary"
                    >
                      {copied ? t("issue.looper.thread.spec_gate.copied") : t("issue.looper.thread.spec_gate.copy")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {role.messages.length > 0 && (
            <ol className="space-y-1.5">
              {role.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </ol>
          )}

          {view.showOfflineQueueNotice && (
            <p className="text-caption-md-regular text-tertiary">{t("issue.looper.thread.queued_offline")}</p>
          )}

          {isLooperThinking && !view.showOfflineQueueNotice && (
            <p className="text-caption-md-regular text-tertiary">{t("issue.looper.thread.thinking")}</p>
          )}

          {view.status === "resolved" && (
            <p className="text-caption-md-regular text-tertiary">{t("issue.looper.thread.resolved_hint")}</p>
          )}

          {showComposer && (
            <div>
              <label htmlFor={`looper-reply-${role.role}`} className="text-caption-sm-medium text-secondary">
                {t("issue.looper.thread.composer.label")}
              </label>
              <textarea
                id={`looper-reply-${role.role}`}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={t("issue.looper.thread.composer.placeholder")}
                rows={3}
                className="focus:border-accent-primary mt-1 w-full resize-y rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-body-xs-regular text-primary outline-none"
              />
              <div className="mt-1.5 flex flex-wrap items-center justify-end gap-2">
                {isNodeOffline && (
                  <span className="mr-auto text-caption-sm-regular text-tertiary">
                    {t("issue.looper.thread.composer.offline_hint")}
                  </span>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!draft.trim()}
                  loading={isSubmitting}
                  onClick={() => void submitReply()}
                >
                  {t("issue.looper.thread.composer.submit")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
