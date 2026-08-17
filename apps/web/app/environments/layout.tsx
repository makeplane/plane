/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Outlet } from "react-router";
import { useTranslation } from "@plane/i18n";
import type { TModuleCatalogResponse } from "@plane/types";
import { AppHeader } from "@/components/core/app-header";
import { PageHead } from "@/components/core/page-title";
import { useProject } from "@/hooks/store/use-project";
import { useModuleCatalog } from "@/app/overlay/use-module-catalog";
import { EnvironmentsPrimaryHeader } from "./components/header";
import { EnvironmentsTabNavigation } from "./components/tab-navigation";

export type TEnvironmentsOutletContext = {
  catalog: TModuleCatalogResponse | null;
  loading: boolean;
  reload: () => Promise<void>;
};

function EnvironmentsLayout() {
  const { t } = useTranslation();
  const { currentProjectDetails } = useProject();
  const { catalog, loading, reload } = useModuleCatalog("environments");

  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails.name} - ${t("environments.title")}`
    : t("environments.title");

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <PageHead title={pageTitle} />
      <AppHeader header={<EnvironmentsPrimaryHeader catalog={catalog} reload={reload} />} />
      <EnvironmentsTabNavigation />
      <div className="min-h-0 flex-1 overflow-hidden">
        <Outlet context={{ catalog, loading, reload } satisfies TEnvironmentsOutletContext} />
      </div>
    </div>
  );
}

export default observer(EnvironmentsLayout);
