/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * The fixed Workspace Dashboard shell (spec §6, §7.2–§7.5, §8, §20).
 *
 * Composition is product-defined and non-editable: a KPI band, then the four
 * §7 sections, laid out on a fixed responsive grid. There is no drag, no
 * resize, no layout persistence and no persisted widget list — only the
 * per-user query preferences in the store.
 *
 * One rule drives the data flow: any preference change re-composes the batch
 * request, and a debounced effect turns a burst of changes into exactly one
 * `POST /analytics/v2/batch/`. Twelve cards never mean twelve requests.
 */

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { useUser } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { AnalyticsService } from "@/services/analytics.service";
import { dashboardPreferencesStore } from "@/store/dashboard-preferences.store";

import {
  buildDashboardBatchRequest,
  isDashboardDataEmpty,
  normalizeDashboardBatchResponse,
  type TWorkspaceDashboardBatch,
  type TWorkspaceDashboardBatchQuery,
  type TWorkspaceDashboardGlobalScope,
} from "./batch-composer";
import {
  WORKSPACE_DASHBOARD_CARDS,
  WORKSPACE_DASHBOARD_SECTIONS,
  type TCardDefinition,
  type TCardPreference,
} from "./card-registry";
import { WorkspaceDashboardCard } from "./dashboard-card";
import { WorkspaceDashboardGlobalControls } from "./global-controls";
import { useDashboardSmartDefault } from "./use-smart-default";

/** §20 — coalesce a burst of control changes into one request. */
export const DASHBOARD_BATCH_DEBOUNCE_MS = 250;

const analyticsService = new AnalyticsService();

type Props = {
  workspaceSlug: string;
};

/** §6.1 / §6 — 320 base, 640 (`sm`), 1024 (`lg`). Fixed, never user-resized. */
const SECTION_GRID = "grid grid-cols-1 gap-3 sm:grid-cols-1 lg:grid-cols-2";
const KPI_GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5";
const CARD_SURFACE = "flex flex-col rounded-md border border-subtle bg-layer-1";

export function WorkspaceDashboardShell({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const { currentWorkspace } = useWorkspace();
  const userId = currentUser?.id ?? null;
  const workspaceId = currentWorkspace?.id ?? null;

  // §3 — seed viewMode + assignee scope from the viewer's role on first mount.
  useDashboardSmartDefault();

  const preferences = useSyncExternalStore(
    dashboardPreferencesStore.subscribe,
    dashboardPreferencesStore.getSnapshot,
    dashboardPreferencesStore.getSnapshot
  );
  const scope = preferences.global;

  const [batch, setBatch] = useState<TWorkspaceDashboardBatch | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardPreferencesStore.setIdentity(workspaceId, userId);
  }, [userId, workspaceId]);

  // §20 — the payload is a pure function of preferences, so the fetch keys off
  // the serialised request rather than off any individual control.
  const request = useMemo(() => buildDashboardBatchRequest(preferences.cards, scope), [preferences.cards, scope]);
  const requestKey = useMemo(() => JSON.stringify(request), [request]);

  const [debouncedRequestKey, setDebouncedRequestKey] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedRequestKey(requestKey), DASHBOARD_BATCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [requestKey]);

  useEffect(() => {
    if (!debouncedRequestKey) return;
    let cancelled = false;
    setIsLoading(true);

    void analyticsService
      .postAnalyticsV2Batch(workspaceSlug, JSON.parse(debouncedRequestKey))
      .then((response) => {
        if (!cancelled) setBatch(normalizeDashboardBatchResponse(response?.results));
        return response;
      })
      .catch(() => {
        // §11 — the whole request failing is still a per-card state, not a
        // blank page: every card renders its own error.
        if (!cancelled) setBatch(normalizeDashboardBatchResponse(undefined));
        return null;
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedRequestKey, workspaceSlug]);

  const setGlobalScope = useCallback((updates: Partial<TWorkspaceDashboardGlobalScope>) => {
    dashboardPreferencesStore.setGlobalScope(updates);
  }, []);

  const setCardPreference = useCallback((cardId: string, updates: Partial<TCardPreference>) => {
    dashboardPreferencesStore.setCardPreference(cardId, updates);
  }, []);

  const queriesByCardId = useMemo(() => {
    const out: Record<string, TWorkspaceDashboardBatchQuery> = {};
    for (const query of request.queries) out[String(query.key)] = query;
    return out;
  }, [request.queries]);

  const hasNoData = !isLoading && isDashboardDataEmpty(batch);

  return (
    <div className="flex h-full flex-col overflow-y-auto" data-testid="workspace-dashboard-v3">
      <WorkspaceDashboardGlobalControls
        scope={scope}
        onChange={setGlobalScope}
        onReset={dashboardPreferencesStore.reset}
      />

      {hasNoData ? (
        // §4.2 — a data-empty state, never a "create a dashboard / add widget"
        // prompt. The dashboard exists because the workspace does.
        <div className="p-5" data-testid="workspace-dashboard-v3-empty">
          <EmptyStateCompact assetKey="unknown" title={t("dashboard_v3.empty.title")} />
        </div>
      ) : (
        <div className="flex flex-col gap-5 p-5">
          {WORKSPACE_DASHBOARD_SECTIONS.map((section) => {
            const cards = WORKSPACE_DASHBOARD_CARDS.filter((entry) => entry.section === section.id);
            if (cards.length === 0) return null;
            return (
              <section
                key={section.id}
                className="flex flex-col gap-2"
                data-testid={`dashboard-v3-section-${section.id}`}
              >
                {section.id === "kpi" ? null : (
                  <h2 className="text-14 font-medium text-primary">{t(section.titleKey)}</h2>
                )}
                <div className={section.id === "kpi" ? KPI_GRID : SECTION_GRID}>
                  {cards.map((card) => (
                    <WorkspaceDashboardCardFrame
                      key={card.id}
                      card={card}
                      batch={batch}
                      queriesByCardId={queriesByCardId}
                      workspaceSlug={workspaceSlug}
                      onPreferenceChange={setCardPreference}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

type FrameProps = {
  card: TCardDefinition;
  batch: TWorkspaceDashboardBatch | undefined;
  queriesByCardId: Record<string, TWorkspaceDashboardBatchQuery>;
  workspaceSlug: string;
  onPreferenceChange: (cardId: string, updates: Partial<TCardPreference>) => void;
};

/**
 * Split out so each card frame reads only its own preference slice and owns
 * its own reset. At twelve cards a shared re-render is cheaper than a keyed
 * subscription tree, and the payload is already scoped per card (§20).
 */
function WorkspaceDashboardCardFrame({ card, batch, queriesByCardId, workspaceSlug, onPreferenceChange }: FrameProps) {
  const preference = useSyncExternalStore(
    dashboardPreferencesStore.subscribe,
    () => dashboardPreferencesStore.getCardPreference(card.id),
    () => dashboardPreferencesStore.getCardPreference(card.id)
  );

  const query = queriesByCardId[card.id];
  if (!query) return null;

  return (
    <div
      className={`${CARD_SURFACE} ${card.wide ? "lg:col-span-2" : ""} ${
        card.section === "kpi" ? "min-h-[120px]" : "min-h-[260px]"
      }`}
      data-testid={`dashboard-v3-card-frame-${card.id}`}
    >
      <WorkspaceDashboardCard
        card={card}
        preference={preference}
        query={query}
        result={batch?.[card.id]}
        workspaceSlug={workspaceSlug}
        onPreferenceChange={(updates) => onPreferenceChange(card.id, updates)}
        onReset={() => dashboardPreferencesStore.resetCard(card.id)}
      />
    </div>
  );
}
