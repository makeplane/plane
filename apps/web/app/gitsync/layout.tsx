/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Outlet } from "react-router";
import { useTranslation } from "@plane/i18n";
import { AppHeader } from "@/components/core/app-header";
import { PageHead } from "@/components/core/page-title";
import { useProject } from "@/hooks/store/use-project";
import { GitsyncPrimaryHeader } from "./components/header";

function GitsyncLayout() {
  const { t } = useTranslation();
  const { currentProjectDetails } = useProject();

  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails.name} - ${t("gitsync.title")}`
    : t("gitsync.title");

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <PageHead title={pageTitle} />
      <AppHeader header={<GitsyncPrimaryHeader />} />
      <div className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

export default observer(GitsyncLayout);
