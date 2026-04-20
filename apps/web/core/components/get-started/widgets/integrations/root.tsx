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

import type { FC } from "react";
import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// hooks
import { useChatSupport } from "@/hooks/use-chat-support";
import { usePowerK } from "@/hooks/store/use-power-k";
import { useIntegrationPermissions } from "@/hooks/store/integrations/use-integration-permissions";
// local imports
import { WidgetWrapper } from "../widget-wrapper";
import { IntegrationsPanel } from "./integrations-panel";
import { UsefulLinksPanel } from "./useful-links-panel";
import { createUsefulLinks } from "./utils";

export const IntegrationsView: FC = observer(function IntegrationsView() {
  const { workspaceSlug } = useParams();
  const { toggleShortcutsListModal } = usePowerK();
  const { openChatSupport, isEnabled: isChatSupportEnabled } = useChatSupport();
  const { getCanView } = useIntegrationPermissions();
  // derived
  const hasIntegrationsSectionPermission = workspaceSlug ? getCanView(workspaceSlug) : false;

  const usefulLinks = useMemo(
    () =>
      createUsefulLinks({
        openChatSupport,
        isChatSupportEnabled,
        toggleShortcutsListModal,
      }),
    [openChatSupport, isChatSupportEnabled, toggleShortcutsListModal]
  );

  return (
    <WidgetWrapper>
      <div className="flex gap-4 justify-between">
        {hasIntegrationsSectionPermission && workspaceSlug && <IntegrationsPanel workspaceSlug={workspaceSlug} />}
        <UsefulLinksPanel links={usefulLinks} showFullWidth={!hasIntegrationsSectionPermission} />
      </div>
    </WidgetWrapper>
  );
});
