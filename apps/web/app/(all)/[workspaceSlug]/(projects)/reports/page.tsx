/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { TimeReportRoot } from "@/components/time-reports";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import type { Route } from "./+types/page";

function WorkspaceReportsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();

  const pageTitle = currentWorkspace?.name
    ? t("time_reports.page_label", { workspace: currentWorkspace?.name })
    : undefined;

  const canViewReports = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  if (!canViewReports) {
    return (
      <div className="flex h-full w-full items-center justify-center text-13 text-tertiary">
        {t("time_reports.errors.no_access")}
      </div>
    );
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <TimeReportRoot workspaceSlug={workspaceSlug} />
    </>
  );
}

export default observer(WorkspaceReportsPage);
