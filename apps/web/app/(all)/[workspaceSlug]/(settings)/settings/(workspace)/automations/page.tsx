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
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { WorkspaceCustomAutomationsRoot } from "@/components/automations/workspace-root";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import type { Route } from "./+types/page";
import { AutomationsWorkspaceSettingsHeader } from "./header";

function WorkspaceAutomationSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const {
    workspaceAutomations: { getCanViewAutomation },
  } = useAutomations();
  // derived values
  const canView = getCanViewAutomation(workspaceSlug);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Automations` : undefined;

  if (!canView) {
    return <NotAuthorizedView section="settings" />;
  }

  return (
    <SettingsContentWrapper header={<AutomationsWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <section className="w-full">
        <SettingsHeading
          title={t("automations.global_automations.settings.title")}
          description={t("automations.global_automations.settings.description")}
        />
      </section>
      <WorkspaceCustomAutomationsRoot workspaceSlug={workspaceSlug} />
    </SettingsContentWrapper>
  );
}

export default observer(WorkspaceAutomationSettingsPage);
