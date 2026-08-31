/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { ProjectInfoRoot } from "@/components/project-info/project-info-root";
// hooks
import { useProject } from "@/hooks/store/use-project";
import type { Route } from "./+types/page";

function ProjectInfoPage(_props: Route.ComponentProps) {
  const { t } = useTranslation();
  const { currentProjectDetails } = useProject();

  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails.name} - ${t("sidebar.project_info")}`
    : t("sidebar.project_info");

  return (
    <div className="flex h-full flex-col">
      <PageHead title={pageTitle} />
      <ProjectInfoRoot />
    </div>
  );
}

export default observer(ProjectInfoPage);
