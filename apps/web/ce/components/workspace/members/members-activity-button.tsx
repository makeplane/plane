/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { History } from "lucide-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { WorkspaceActivityDrawer } from "./activity";

export const MembersActivityButton = observer(function MembersActivityButton(props: { workspaceSlug: string }) {
  const { workspaceSlug } = props;
  // states
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // plane hooks
  const { t } = useTranslation();

  // derived values
  const canViewWorkspaceActivity = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  if (!canViewWorkspaceActivity) return <></>;

  return (
    <>
      <Button
        variant="secondary"
        size="lg"
        prependIcon={<History />}
        onClick={() => setIsActivityDrawerOpen(true)}
      >
        {t("common.activity")}
      </Button>
      <WorkspaceActivityDrawer
        key={workspaceSlug}
        isOpen={isActivityDrawerOpen}
        onClose={() => setIsActivityDrawerOpen(false)}
        workspaceSlug={workspaceSlug}
      />
    </>
  );
});
