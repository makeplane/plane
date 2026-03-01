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
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// plane web hooks
import { useFlag } from "@/plane-web/hooks/store";
import { useWorkspaceMembersActivity } from "@/plane-web/hooks/store/use-workspace-members-activity";

type TMembersActivityButtonProps = { workspaceSlug: string };

export const MembersActivityButton = observer(function MembersActivityButton(props: TMembersActivityButtonProps) {
  const { workspaceSlug } = props;
  // store hooks
  const isMembersActivityEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.WORKSPACE_MEMBER_ACTIVITY);
  const { toggleWorkspaceMembersActivitySidebar } = useWorkspaceMembersActivity();
  const { t } = useTranslation();

  return (
    <>
      {isMembersActivityEnabled && (
        <Button
          variant="secondary"
          size="lg"
          onClick={() => toggleWorkspaceMembersActivitySidebar(workspaceSlug, true)}
        >
          {t("activity")}
        </Button>
      )}
    </>
  );
});
