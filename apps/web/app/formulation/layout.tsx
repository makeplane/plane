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
import type { TModuleCatalogResponse, TTesthubCatalogResponse } from "@plane/types";
import { AppHeader } from "@/components/core/app-header";
import { PageHead } from "@/components/core/page-title";
import { useProject } from "@/hooks/store/use-project";
import { useModuleCatalog } from "@/app/overlay/use-module-catalog";
import { FormulationPrimaryHeader } from "./components/header";
import { FormulationTabNavigation } from "./components/tab-navigation";

export type TFormulationOutletContext = {
  catalog: TModuleCatalogResponse | null;
  testhub: TTesthubCatalogResponse | null;
  loading: boolean;
  testhubLoading: boolean;
  reload: () => Promise<void>;
};

function FormulationLayout() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { currentProjectDetails } = useProject();
  const { catalog, loading, reload: reloadFeatures } = useModuleCatalog("features");
  const [testhub, setTesthub] = useState<TTesthubCatalogResponse | null>(null);
  const [testhubLoading, setTesthubLoading] = useState(true);

  const reloadTesthub = useCallback(async () => {
    if (!workspaceSlug || !projectId) return;
    const data = await testhubService.getCatalog(workspaceSlug, projectId);
    setTesthub(data);
  }, [workspaceSlug, projectId]);

  const reload = useCallback(async () => {
    await Promise.all([reloadFeatures(), reloadTesthub()]);
  }, [reloadFeatures, reloadTesthub]);

  useEffect(() => {
    let cancelled = false;
    setTesthubLoading(true);
    reloadTesthub()
      .catch(() => {
        if (!cancelled) setTesthub({ repo: null, snapshot: null });
      })
      .finally(() => {
        if (!cancelled) setTesthubLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadTesthub]);

  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails.name} - ${t("formulation.title")}`
    : t("formulation.title");

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <PageHead title={pageTitle} />
      <AppHeader header={<FormulationPrimaryHeader catalog={catalog} reload={reload} />} />
      <FormulationTabNavigation />
      <div className="min-h-0 flex-1 overflow-hidden">
        <Outlet context={{ catalog, testhub, loading, testhubLoading, reload } satisfies TFormulationOutletContext} />
      </div>
    </div>
  );
}

export default observer(FormulationLayout);
