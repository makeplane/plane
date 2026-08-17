/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useOutletContext, useParams, useSearchParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { Tabs } from "@plane/propel/tabs";
import { gitsyncService } from "@plane/services";
import { ApiExplorer } from "@/app/testhub/components/api-docs/api-explorer";
import { TesthubListRow } from "@/app/testhub/components/list-row";
import {
  TesthubPageBody,
  TesthubPageLoader,
  TesthubSectionTitle,
  TesthubSplitBody,
} from "@/app/testhub/components/page-shell";
import { TesthubUnbound } from "@/app/testhub/components/unbound";
import type { TFormulationOutletContext } from "../layout";

const TABS = ["apis", "pages"] as const;

function AutomationPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TFormulationOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const configHref = `/${workspaceSlug}/projects/${projectId}/gitsync`;
  const tabParam = searchParams.get("tab");
  const tab = TABS.includes(tabParam as (typeof TABS)[number]) ? (tabParam as (typeof TABS)[number]) : "apis";
  const selectedFile = searchParams.get("api") ?? "";

  const apiObjects = catalog?.payload?.components?.api_objects ?? [];
  const pageObjects = catalog?.payload?.components?.page_objects ?? [];

  const setTab = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", value);
          if (value !== "apis") next.delete("api");
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setApi = useCallback(
    (file: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", "apis");
          next.set("api", file);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const loadFile = useCallback(
    async (path: string) => {
      if (!workspaceSlug || !projectId) return { content: "" };
      return gitsyncService.getModuleFile(workspaceSlug, projectId, "features", path);
    },
    [workspaceSlug, projectId]
  );

  const loadFileMemo = useMemo(() => loadFile, [loadFile]);

  if (loading) return <TesthubPageLoader />;
  if (!catalog?.remote) {
    return (
      <TesthubUnbound
        href={configHref}
        title={t("formulation.unbound")}
        description={t("formulation.unbound_description")}
        cta={t("formulation.cta")}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-subtle px-page-x py-2">
        <Tabs value={tab} onValueChange={setTab} className="h-auto">
          <Tabs.List className="max-w-md">
            <Tabs.Trigger value="apis">{t("formulation.nav.automation")}</Tabs.Trigger>
            <Tabs.Trigger value="pages">{t("formulation.page_objects")}</Tabs.Trigger>
          </Tabs.List>
        </Tabs>
      </div>
      {tab === "apis" ? (
        <TesthubSplitBody>
          <ApiExplorer apis={apiObjects} selectedFile={selectedFile} onSelect={setApi} loadFile={loadFileMemo} />
        </TesthubSplitBody>
      ) : (
        <TesthubPageBody>
          <TesthubSectionTitle>{t("formulation.page_objects")}</TesthubSectionTitle>
          {pageObjects.length ? (
            <div className="overflow-hidden rounded-md border border-subtle">
              {pageObjects.map((row) => (
                <TesthubListRow key={row.path}>
                  <span className="truncate text-primary">
                    {row.name}
                    <span className="ml-2 text-tertiary">{row.path}</span>
                  </span>
                </TesthubListRow>
              ))}
            </div>
          ) : (
            <EmptyStateCompact assetKey="note" title={t("formulation.empty")} />
          )}
        </TesthubPageBody>
      )}
    </div>
  );
}

export default observer(AutomationPage);
