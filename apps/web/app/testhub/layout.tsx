/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Outlet, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { testhubService } from "@plane/services";
import type { TTesthubCatalogResponse } from "@plane/types";
import { AppHeader } from "@/components/core/app-header";
import { PageHead } from "@/components/core/page-title";
import { useProject } from "@/hooks/store/use-project";
import { TesthubPrimaryHeader } from "./components/header";
import { TesthubTabNavigation } from "./components/tab-navigation";

export type TTesthubOutletContext = {
  catalog: TTesthubCatalogResponse | null;
  loading: boolean;
  reload: () => Promise<void>;
};

function TesthubLayout() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { currentProjectDetails } = useProject();
  const [catalog, setCatalog] = useState<TTesthubCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!workspaceSlug || !projectId) return;
    const data = await testhubService.getCatalog(workspaceSlug, projectId);
    setCatalog(data);
  }, [workspaceSlug, projectId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reload()
      .catch(() => {
        if (!cancelled) setCatalog({ repo: null, snapshot: null });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails.name} - ${t("testhub.title")}`
    : t("testhub.title");

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <PageHead title={pageTitle} />
      <AppHeader header={<TesthubPrimaryHeader catalog={catalog} reload={reload} />} />
      <TesthubTabNavigation />
      <div className="min-h-0 flex-1 overflow-hidden">
        <Outlet context={{ catalog, loading, reload } satisfies TTesthubOutletContext} />
      </div>
    </div>
  );
}

export default observer(TesthubLayout);
