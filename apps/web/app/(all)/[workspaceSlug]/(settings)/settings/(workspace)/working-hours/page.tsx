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
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { WorkspaceWorkingHours } from "@/components/workspace/settings/working-hours";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// local imports
import { WorkingHoursSettingsHeader } from "./header";

function WorkingHoursSettingsPage() {
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const pageTitle = currentWorkspace?.name
    ? t("workspace_settings.page_label", { workspace: currentWorkspace.name })
    : undefined;

  return (
    <SettingsContentWrapper header={<WorkingHoursSettingsHeader />}>
      <PageHead title={pageTitle} />
      <WorkspaceWorkingHours />
    </SettingsContentWrapper>
  );
}

export default observer(WorkingHoursSettingsPage);
