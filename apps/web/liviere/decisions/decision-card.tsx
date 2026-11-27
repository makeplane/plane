/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: one decision: number, rule, date, author, kind, work items and badges; opened, also why,
// what was rejected, the chain of versions, related decisions, note, sources, history and the actions.

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { DecisionActions } from "./decision-actions";
import type { TDecisionsContext } from "./decisions-root";
import { formatDate, reviewBadge, splitCode, versionChain } from "./model";
import { DECISION_EVENT_KINDS, DECISION_FIELDS } from "./types";
import type { TDecision, TDecisionEvent, TDecisionStatus } from "./types";
import { useDecisionDetail } from "./use-decisions";

type Props = {
  context: TDecisionsContext;
  decision: TDecision;
  open: boolean;
  onToggle?: () => void;
  // The area selected in the tree: a decision listed there through its second area says where it is from
  currentArea?: string | null;
  // In the side panel of the map: always open, no toggle
  inDrawer?: boolean;
};

export const STATUS_STRIPE: Record<TDecisionStatus, string> = {
  active: "bg-success-primary",
  proposed: "bg-accent-primary",
  deferred: "bg-warning-primary",
  done: "bg-layer-3",
  superseded: "bg-layer-3",
  revoked: "bg-danger-primary",
};

/** Plain text with `code` spans; never HTML. */
export function RichText(props: { text: string }) {
  return (
    <>
      {splitCode(props.text).map((part) =>
        part.code ? (
          <code key={part.start} className="rounded bg-layer-2 px-1 font-code text-[0.92em]">
            {part.text}
          </code>
        ) : (
          <span key={part.start}>{part.text}</span>
        )
      )}
    </>
  );
}

function Badge(props: { children: ReactNode; tone?: "warning" | "muted" }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-px text-12 whitespace-nowrap",
        props.tone === "warning"
          ? "border-transparent bg-warning-subtle text-warning-primary"
          : "border-subtle text-tertiary"
      )}
    >
      {props.children}
    </span>
  );
}

/** A decision number as a button that goes to it. */
function DecisionLink(props: { context: TDecisionsContext; number: number; current?: boolean }) {
  const { context, number, current } = props;
  const target = context.byNumber.get(number);
  const label = target?.identifier ?? `D${number}`;
  if (current) return <b className="font-code text-12 whitespace-nowrap text-primary">{label}</b>;
  return (
    <button
      type="button"
      className="font-code text-12 whitespace-nowrap text-accent-primary underline-offset-2 hover:underline"
      title={target?.title}
      onClick={() => context.goTo(number)}
    >
      {label}
    </button>
  );
}

const MAX_CHANGE_LENGTH = 120;

export function DecisionCard(props: Props) {
  const { context, decision, open, onToggle, currentArea, inDrawer } = props;
  const { t } = useTranslation();
  const estimated = (field: string) => decision.estimated.includes(field);
  const review = reviewBadge(decision, context.today);
  const fromOtherArea = !!currentArea && decision.area !== currentArea && decision.area2 === currentArea;
  const secondArea = decision.area2 && decision.area2 !== decision.area ? decision.area2 : null;

  const author = t(`liviere.decisions.author.${decision.decided_by}`);
  const badges: ReactNode[] = [];
  if (decision.status !== "active")
    badges.push(<Badge key="status">{t(`liviere.decisions.status.${decision.status}`)}</Badge>);
  if (decision.queues.includes("confirm"))
    badges.push(
      <Badge key="confirm" tone="warning">
        {t("liviere.decisions.badges.confirm")}
      </Badge>
    );
  if (review) {
    const parts = [t(`liviere.decisions.badges.${review.type}`)];
    if (review.date)
      parts.push(
        `${review.estimated ? `${t("liviere.decisions.badges.approx")} ` : ""}${formatDate(review.date)}${
          review.overdue ? ` (${t("liviere.decisions.badges.overdue")})` : ""
        }`
      );
    badges.push(
      <Badge key="review" tone={review.soon ? "warning" : undefined}>
        {parts.join(" ")}
        {review.condition ? `: ${review.condition}` : ""}
      </Badge>
    );
  }
  if (decision.queues.includes("rollout"))
    badges.push(
      <Badge key="rollout" tone="warning">
        {t("liviere.decisions.badges.rollout")}
      </Badge>
    );
  if (decision.needs_review)
    badges.push(
      <Badge key="imported" tone="warning">
        {t("liviere.decisions.badges.imported")}
      </Badge>
    );
  if (secondArea && !fromOtherArea)
    badges.push(
      <Badge key="area2">
        {t("liviere.decisions.badges.also_area", { area: context.areaNames.get(secondArea) ?? secondArea })}
      </Badge>
    );

  const past = decision.status === "superseded" || decision.status === "revoked";
  const titleId = `decision-${decision.number}-title`;
  const head = (
    <>
      <span className="font-code text-12 whitespace-nowrap text-tertiary">{decision.identifier}</span>
      <span
        id={titleId}
        className={cn(
          "min-w-0 font-medium break-words",
          past && "text-tertiary line-through",
          decision.status === "done" && "text-tertiary"
        )}
      >
        <RichText text={decision.title} />
      </span>
    </>
  );

  return (
    <article
      id={inDrawer ? undefined : `decision-${decision.number}`}
      aria-labelledby={titleId}
      className="relative overflow-hidden rounded-lg border border-subtle bg-surface-1 text-13"
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", STATUS_STRIPE[decision.status])} aria-hidden="true" />
      {inDrawer ? (
        <div className="flex items-baseline gap-2.5 px-4 pt-2.5 pb-0.5">{head}</div>
      ) : (
        <button
          type="button"
          className="flex w-full items-baseline gap-2.5 px-4 pt-2.5 pb-0.5 text-left"
          aria-expanded={open}
          onClick={onToggle}
        >
          {head}
        </button>
      )}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-4 pb-2.5 text-12 text-tertiary">
        <span>
          {decision.decided_on
            ? `${formatDate(decision.decided_on)}${estimated("decided_on") ? ` (${t("liviere.decisions.card.estimated")})` : ""}`
            : t("liviere.decisions.card.date_unknown")}
        </span>
        <span>
          {author}
          {estimated("decided_by") ? ` (${t("liviere.decisions.card.estimated")})` : ""}
        </span>
        <span>{t(`liviere.decisions.kinds.${decision.kind}`)}</span>
        {fromOtherArea && (
          <span>
            {t("liviere.decisions.card.from_area", {
              area: context.areaNames.get(decision.area) ?? decision.area,
            })}
          </span>
        )}
        {decision.issues.length > 0 && (
          <span className="flex flex-wrap gap-1.5">
            {decision.issues.map((issue) =>
              issue.visible ? (
                <Link
                  key={issue.identifier}
                  href={`/${context.workspaceSlug}/browse/${issue.identifier}/`}
                  title={issue.name}
                  className={cn("underline-offset-2 hover:underline", issue.archived && "line-through")}
                >
                  {issue.identifier}
                </Link>
              ) : (
                <span key={issue.identifier} title={t("liviere.decisions.card.issue_hidden")}>
                  {issue.identifier}
                </span>
              )
            )}
          </span>
        )}
        {badges}
      </div>
      {open && <DecisionCardBody context={context} decision={decision} />}
    </article>
  );
}

function DecisionCardBody(props: { context: TDecisionsContext; decision: TDecision }) {
  const { context, decision } = props;
  const { t } = useTranslation();
  const chain = versionChain(context.byNumber, decision.number);
  const hasChain = chain.previous.length > 0 || chain.next.length > 0;
  const related = decision.related.filter((number) => context.byNumber.has(number));

  return (
    <div className="flex flex-col gap-2 border-t border-subtle px-4 pt-2.5 pb-3">
      {decision.rationale && (
        <p>
          <b>{t("liviere.decisions.card.why")}:</b> <RichText text={decision.rationale} />
        </p>
      )}
      {decision.rejected && (
        <p>
          <b>{t("liviere.decisions.card.rejected")}:</b> <RichText text={decision.rejected} />
        </p>
      )}
      {hasChain && (
        <div>
          <b>{t("liviere.decisions.card.chain")}:</b>
          <ol className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {chain.previous.map((item) => (
              <li key={item.number} className="flex items-center gap-1.5">
                <DecisionLink context={context} number={item.number} />
                <span className="text-tertiary" aria-hidden="true">
                  →
                </span>
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <DecisionLink context={context} number={decision.number} current />
            </li>
            {chain.next.map((generation) => (
              <li key={generation[0].number} className="flex items-center gap-1.5">
                <span className="text-tertiary" aria-hidden="true">
                  →
                </span>
                {generation.map((item, position) => (
                  <span key={item.number} className="flex items-center gap-1">
                    {position > 0 && <span className="text-tertiary">+</span>}
                    <DecisionLink context={context} number={item.number} />
                  </span>
                ))}
              </li>
            ))}
          </ol>
          {chain.siblings.length > 0 && decision.supersedes !== null && (
            <p className="mt-1 text-12 text-tertiary">
              {t("liviere.decisions.card.split_from", {
                from: context.byNumber.get(decision.supersedes)?.identifier ?? `D${decision.supersedes}`,
                others: chain.siblings.map((item) => item.identifier).join(", "),
              })}
            </p>
          )}
        </div>
      )}
      {related.length > 0 && (
        <div>
          <b>{t("liviere.decisions.card.related")}:</b>
          <ul className="mt-1 flex flex-col gap-0.5">
            {related.map((number) => (
              <li key={number} className="flex items-baseline gap-2">
                {/* the number keeps its width, the rule wraps */}
                <DecisionLink context={context} number={number} />
                <span className="min-w-0 text-secondary">
                  <RichText text={context.byNumber.get(number)!.title} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {decision.note && (
        <p>
          <b>{t("liviere.decisions.card.note")}:</b> {decision.note}
        </p>
      )}
      <p className="text-12 text-tertiary">
        {t("liviere.decisions.card.sources")}:{" "}
        {decision.sources.length ? decision.sources.join("; ") : t("liviere.decisions.card.no_sources")}
      </p>
      <DecisionHistory context={context} number={decision.number} />
      <DecisionActions context={context} decision={decision} />
    </div>
  );
}

function DecisionHistory(props: { context: TDecisionsContext; number: number }) {
  const { context, number } = props;
  const { t, currentLocale } = useTranslation();
  const { data, error, isLoading } = useDecisionDetail(context.workspaceSlug, context.projectId, number);
  if (error) return <p className="text-12 text-danger-primary">{t("liviere.decisions.card.history_error")}</p>;
  if (isLoading || !data) return <p className="text-12 text-tertiary">{t("liviere.decisions.card.history_loading")}</p>;
  if (!data.history.length) return null;

  const when = (value: string) =>
    new Date(value).toLocaleString(currentLocale, {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: context.timeZone,
    });
  const label = (event: TDecisionEvent) =>
    (DECISION_EVENT_KINDS as readonly string[]).includes(event.kind)
      ? t(`liviere.decisions.events.${event.kind}`)
      : event.kind;
  const value = (field: string, raw: unknown): string => {
    if (raw === null || raw === undefined || raw === "") return "—";
    if (typeof raw === "boolean") return t(raw ? "liviere.decisions.card.yes" : "liviere.decisions.card.no");
    if (field === "status" && typeof raw === "string") return t(`liviere.decisions.status.${raw}`);
    if (field === "kind" && typeof raw === "string") return t(`liviere.decisions.kinds.${raw}`);
    if (field === "decided_by" && typeof raw === "string") return t(`liviere.decisions.author.${raw}`);
    const text = Array.isArray(raw) ? raw.join(", ") : typeof raw === "object" ? JSON.stringify(raw) : String(raw);
    return text.length > MAX_CHANGE_LENGTH ? `${text.slice(0, MAX_CHANGE_LENGTH)}…` : text;
  };
  const fieldLabel = (field: string) =>
    (DECISION_FIELDS as readonly string[]).includes(field) ? t(`liviere.decisions.fields.${field}`) : field;

  return (
    <div>
      <b className="text-12 text-tertiary">{t("liviere.decisions.card.history")}</b>
      <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-5 text-12 text-tertiary">
        {data.history.map((event) => (
          <li key={event.id}>
            <span>{when(event.occurred_at)}</span>: <span className="text-secondary">{label(event)}</span>
            {event.actor && ` · ${event.actor.display_name}`}
            {` · ${t(`liviere.decisions.channel.${event.channel}`)}`}
            {event.note && ` · ${event.note}`}
            {Object.entries(event.changes ?? {}).map(([field, change]) => (
              <span key={field} className="block">
                {fieldLabel(field)}: {value(field, change?.[0])} → {value(field, change?.[1])}
              </span>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
