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
import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useChatSupport } from "@/hooks/use-chat-support";
import { usePowerK } from "@/hooks/store/use-power-k";
import { useUserPermissions } from "@/hooks/store/user/user-permissions";
import { WidgetWrapper } from "../widget-wrapper";
import { IntegrationsPanel } from "./integrations-panel";
import { UsefulLinksPanel } from "./useful-links-panel";
import { createUsefulLinks } from "./utils";

export const IntegrationsView: FC = observer(function IntegrationsView() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { toggleShortcutsListModal } = usePowerK();
  const { openChatSupport, isEnabled: isChatSupportEnabled } = useChatSupport();
  const { allowPermissions } = useUserPermissions();

  const isWorkspaceAdmin = useMemo(
    () => allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE),
    [allowPermissions]
  );

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
        {isWorkspaceAdmin && <IntegrationsPanel workspaceSlug={workspaceSlug} />}
        <UsefulLinksPanel links={usefulLinks} isWorkspaceAdmin={isWorkspaceAdmin} />
      </div>
    </WidgetWrapper>
  );
});
