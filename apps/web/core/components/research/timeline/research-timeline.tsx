/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TTimelineFilters } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { ChainFilters } from "@/components/research/timeline/chain-filters";
import { DevelopmentChainView } from "@/components/research/timeline/development-chain-view";
import { ThinkingChainView } from "@/components/research/timeline/thinking-chain-view";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

/**
 * Full flow timeline with the two chains side by side (P1-CHAIN-01/02/06).
 * Every node is a reference to its source object.
 */
export const ResearchTimeline = observer(function ResearchTimeline({ workspaceSlug, projectId }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const [filters, setFilters] = useState<TTimelineFilters>({});
  const timeline = research.getTimeline(projectId);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    await research.fetchTimeline(workspaceSlug, projectId, filters).catch(() => undefined);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, workspaceSlug, JSON.stringify(filters)]);

  useEffect(() => {
    void load();
  }, [load]);

  const items = timeline?.items ?? [];
  const thinking = items.filter((item) => item.chains.includes("thinking"));
  const development = items.filter((item) => item.chains.includes("development"));
  const showChains = !filters.chain;

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ChainFilters filters={filters} onChange={setFilters} />
        <a
          className="text-12 text-accent-primary hover:underline"
          href={research.timelineExportUrl(workspaceSlug, projectId, filters.chain)}
          target="_blank"
          rel="noreferrer"
        >
          {t("research.timeline.export")}
        </a>
      </div>

      {timeline?.degraded_sources?.length ? (
        <p className="text-12 text-warning-primary">
          {t("research.timeline.degraded", { systems: timeline.degraded_sources.join(", ") })}
        </p>
      ) : null}

      {!loaded && <p className="text-12 text-tertiary">{t("research.common.loading")}</p>}

      {showChains ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="flex flex-col gap-2">
            <h3 className="text-13 font-medium text-primary">{t("research.timeline.chain.thinking")}</h3>
            <ThinkingChainView items={thinking} />
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="text-13 font-medium text-primary">{t("research.timeline.chain.development")}</h3>
            <DevelopmentChainView items={development} />
          </section>
        </div>
      ) : (
        <ThinkingChainView items={items} />
      )}
    </div>
  );
});
