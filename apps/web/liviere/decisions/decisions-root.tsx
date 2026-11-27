/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: the decision register of a project. The whole register is loaded once and filtered
// here; the view, area, queue, filters and the opened decision live in the URL (?d=12 links to a decision),
// the search phrase only in memory.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { Loader } from "@plane/blocks/skeleton";
import { useProject } from "@/hooks/store/use-project";
import { useQueryParams } from "@/hooks/use-query-params";
import { DecisionsUnavailable, unavailableReason } from "./decisions-unavailable";
import { DecisionsList } from "./decisions-list";
import { DecisionsTree } from "./decisions-tree";
import {
  STATUS_FILTERS,
  areaMatches,
  baseMatches,
  hiddenByStatus,
  parseViewState,
  treeCounts,
  viewStateParams,
} from "./model";
import type { TDecisionFilter, TDecisionViewState } from "./model";
import { DECISION_KINDS, DECISION_QUEUES } from "./types";
import type { TDecision } from "./types";
import { useDecisionAreas, useDecisionList, useDecisionQueues, useDecisionSearch } from "./use-decisions";

type Props = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

export type TDecisionsContext = {
  workspaceSlug: string;
  projectId: string;
  byNumber: Map<number, TDecision>;
  areaNames: Map<string, string>;
  // area key -> mechanism key -> name
  mechanismNames: Map<string, Map<string, string>>;
  // Today in the project time zone (from queues/), for review dates
  today: string | null;
  // IANA name of the project time zone, for the times of the history
  timeZone: string;
  goTo: (number: number) => void;
  // Opens a decision (e.g. a new version right after it was saved), without changing the filters
  open: (number: number) => void;
};

const selectClass =
  "h-8 rounded-md border border-subtle bg-surface-1 px-2 text-13 text-primary disabled:cursor-not-allowed disabled:opacity-60";

export const ProjectDecisionsRoot = observer(function ProjectDecisionsRoot(props: Props) {
  const { workspaceSlug, projectId, isAdmin } = props;
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateQueryParams } = useQueryParams();
  const { getProjectById } = useProject();
  const timeZone = getProjectById(projectId)?.timezone || "UTC";
  const state = parseViewState((name) => searchParams.get(name));
  const setState = useCallback(
    (change: Partial<TDecisionViewState>) => {
      const { add, remove } = viewStateParams({ ...parseViewState((name) => searchParams.get(name)), ...change });
      router.replace(updateQueryParams({ paramsToAdd: add, paramsToRemove: remove }));
    },
    [router, searchParams, updateQueryParams]
  );

  const list = useDecisionList(workspaceSlug, projectId, true);
  const areas = useDecisionAreas(workspaceSlug, projectId, true);
  const queues = useDecisionQueues(workspaceSlug, projectId, true);
  const decisions = useMemo(() => list.data?.results ?? [], [list.data]);
  const [phrase, setPhrase] = useState("");
  const search = useDecisionSearch(workspaceSlug, projectId, phrase, decisions);
  // Cards opened besides the one in the URL
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const [treeOpen, setTreeOpen] = useState(false);

  const byNumber = useMemo(() => new Map(decisions.map((decision) => [decision.number, decision])), [decisions]);
  const areaList = useMemo(() => areas.data ?? [], [areas.data]);
  const areaNames = useMemo(() => new Map(areaList.map((area) => [area.key, area.name])), [areaList]);
  const mechanismNames = useMemo(
    () =>
      new Map(
        areaList.map((area) => [area.key, new Map(area.mechanisms.map((mechanism) => [mechanism.key, mechanism.name]))])
      ),
    [areaList]
  );

  const filter: TDecisionFilter = { status: state.status, kind: state.kind, queue: state.queue, hits: search.hits };
  const base = decisions.filter((decision) => baseMatches(decision, filter));
  const counts = treeCounts(base);
  const shown = base.filter((decision) => areaMatches(decision, state.area, state.mech));
  const hidden = hiddenByStatus(decisions, filter);

  // Scrolled into view once rendered: the decision of a ?d= link and the target of goTo, not every opened card
  const scrollTarget = useRef<number | null>(state.d);

  // Going to another version: every state, its area, no queue or phrase; the card opens and scrolls into view
  const goTo = useCallback(
    (number: number) => {
      const decision = byNumber.get(number);
      if (!decision) return;
      scrollTarget.current = number;
      setPhrase("");
      setOpen((current) => new Set(current).add(number));
      setState({ status: "all", queue: null, area: decision.area, mech: null, d: number });
    },
    [byNumber, setState]
  );

  // A link with ?d= to a decision the filters hide: show it the way goTo does, once per decision
  const shownNumbers = new Set(shown.map((decision) => decision.number));
  const revealed = useRef<number | null>(null);
  useEffect(() => {
    if (state.d === null || !byNumber.has(state.d) || revealed.current === state.d) return;
    revealed.current = state.d;
    if (!shownNumbers.has(state.d)) goTo(state.d);
  });
  useEffect(() => {
    if (scrollTarget.current === null) return;
    const element = document.getElementById(`decision-${scrollTarget.current}`);
    if (!element) return;
    scrollTarget.current = null;
    element.scrollIntoView({ block: "center", behavior: "smooth" });
  });

  const toggle = (number: number) => {
    const isOpen = open.has(number) || state.d === number;
    setOpen((current) => {
      const next = new Set(current);
      if (isOpen) next.delete(number);
      else next.add(number);
      return next;
    });
    if (isOpen && state.d === number) setState({ d: null });
    if (!isOpen) setState({ d: number });
  };

  const failure = unavailableReason(list.error) ?? unavailableReason(areas.error);
  if (failure)
    return (
      <DecisionsUnavailable
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        reason={failure}
        isAdmin={isAdmin}
        onRetry={() => {
          void list.mutate();
          void areas.mutate();
        }}
      />
    );

  const context: TDecisionsContext = {
    workspaceSlug,
    projectId,
    byNumber,
    areaNames,
    mechanismNames,
    today: queues.data?.today ?? null,
    timeZone,
    goTo,
    open: (number) => {
      scrollTarget.current = number;
      setOpen((current) => new Set(current).add(number));
      setState({ d: number });
    },
  };
  const selectedAreaName = state.area ? (areaNames.get(state.area) ?? state.area) : t("liviere.decisions.tree.all");

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <input
          type="search"
          value={phrase}
          onChange={(event) => setPhrase(event.target.value)}
          placeholder={t("liviere.decisions.search.placeholder")}
          aria-label={t("liviere.decisions.search.placeholder")}
          maxLength={200}
          className="h-8 w-full rounded-md border border-subtle bg-surface-1 px-3 text-13 text-primary placeholder:text-placeholder sm:w-80"
        />
        <label className="flex items-center gap-2 text-13 text-tertiary">
          {t("liviere.decisions.filters.status")}
          <select
            className={selectClass}
            value={state.status}
            disabled={!!state.queue}
            onChange={(event) => setState({ status: event.target.value as TDecisionViewState["status"] })}
          >
            {STATUS_FILTERS.map((value) => (
              <option key={value} value={value}>
                {t(`liviere.decisions.status_filter.${value}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-13 text-tertiary">
          {t("liviere.decisions.filters.kind")}
          <select
            className={selectClass}
            value={state.kind}
            onChange={(event) => setState({ kind: event.target.value as TDecisionViewState["kind"] })}
          >
            <option value="all">{t("liviere.decisions.filters.all_kinds")}</option>
            {DECISION_KINDS.map((value) => (
              <option key={value} value={value}>
                {t(`liviere.decisions.kinds.${value}`)}
              </option>
            ))}
          </select>
        </label>
        {list.data && (
          <span className="text-13 text-tertiary">
            {t("liviere.decisions.count", { shown: shown.length, total: decisions.length })}
          </span>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2" role="group" aria-label={t("liviere.decisions.queues.label")}>
        {DECISION_QUEUES.map((queue) => {
          const count = queues.data?.[queue] ?? 0;
          const pressed = state.queue === queue;
          return (
            <button
              key={queue}
              type="button"
              aria-pressed={pressed}
              onClick={() => setState({ queue: pressed ? null : queue, area: null, mech: null })}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-13",
                pressed
                  ? "border-accent-strong bg-accent-subtle text-accent-primary"
                  : "border-subtle bg-surface-1 hover:bg-layer-transparent-hover",
                !pressed && count === 0 ? "text-tertiary" : !pressed && "text-primary"
              )}
            >
              {t(`liviere.decisions.queues.${queue}`)}
              <b className="tabular-nums">{queues.data ? count : "…"}</b>
            </button>
          );
        })}
      </div>
      {state.queue === "rollout" && (
        <p className="rounded-md bg-layer-1 px-3 py-2 text-13 text-secondary">
          {t("liviere.decisions.queues.rollout_info")}
        </p>
      )}

      {(search.tooShort || search.loading || search.hasMore || search.error) && (
        <p className="-mt-2 text-12 text-tertiary">
          {search.error
            ? t("liviere.decisions.search.error")
            : search.tooShort
              ? t("liviere.decisions.search.too_short", { min: 3 })
              : search.loading
                ? t("liviere.decisions.search.loading")
                : t("liviere.decisions.search.has_more")}
        </p>
      )}
      {list.data && !list.data.complete && (
        <p className="rounded-md bg-warning-subtle px-3 py-2 text-13 text-warning-primary">
          {t("liviere.decisions.incomplete", { count: decisions.length })}
        </p>
      )}

      {!list.data || !areas.data ? (
        <Loader className="flex flex-col gap-3">
          <Loader.Item height="320px" width="100%" />
        </Loader>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
          <div className="md:sticky md:top-0">
            <button
              type="button"
              className="mb-2 flex w-full items-center justify-between rounded-md border border-subtle bg-surface-1 px-3 py-2 text-13 text-primary md:hidden"
              aria-expanded={treeOpen}
              onClick={() => setTreeOpen((current) => !current)}
            >
              <span>
                {t("liviere.decisions.tree.label")}: {selectedAreaName}
              </span>
              <span aria-hidden="true">{treeOpen ? "▴" : "▾"}</span>
            </button>
            <div className={treeOpen ? "block" : "hidden md:block"}>
              <DecisionsTree
                areas={areaList}
                counts={counts}
                area={state.area}
                mech={state.mech}
                onSelect={(area, mech) => setState({ area, mech, d: null })}
              />
            </div>
          </div>
          <DecisionsList
            context={context}
            decisions={shown}
            areas={areaList}
            area={state.area}
            isOpen={(number) => open.has(number) || state.d === number}
            onToggle={toggle}
            hiddenByStatus={hidden}
            onShowAllStates={() => setState({ status: "all" })}
          />
        </div>
      )}
    </div>
  );
});
