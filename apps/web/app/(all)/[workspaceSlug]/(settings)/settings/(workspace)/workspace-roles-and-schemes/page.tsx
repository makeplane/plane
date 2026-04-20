/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { RolesAndSchemesListPageRoot } from "@/components/roles-and-schemes/list/root";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// local imports
import type { Route } from "./+types/page";
import { WorkspaceRolesAndSchemesHeader } from "./header";

function WorkspaceRolesAndSchemesPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.workspace_roles_and_schemes.title")}`
    : undefined;

  return (
    <SettingsContentWrapper header={<WorkspaceRolesAndSchemesHeader />}>
      <PageHead title={pageTitle} />
      <SettingsHeading
        title={t("workspace_settings.settings.workspace_roles_and_schemes.title")}
        description={t("workspace_settings.settings.roles_and_schemes.description")}
      />
      <RolesAndSchemesListPageRoot workspaceSlug={workspaceSlug} namespace="workspace" />
    </SettingsContentWrapper>
  );
}

export default observer(WorkspaceRolesAndSchemesPage);
