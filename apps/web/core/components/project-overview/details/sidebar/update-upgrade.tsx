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
import { useRouter } from "next/navigation";
// plane imports
import { EmptyStateCompact } from "@plane/propel/empty-state";
// hooks
import { useProject } from "@/hooks/store/use-project";

type TProps = {
  workspaceSlug: string;
  projectId: string;
};

export const UpgradeUpdates = observer(function UpgradeUpdates(props: TProps) {
  const { workspaceSlug, projectId } = props;
  // router
  const router = useRouter();
  // store hooks
  const { permissions: projectPermissions } = useProject();
  // auth
  const canEnable = projectPermissions.getCanEdit(workspaceSlug, projectId);

  return (
    <EmptyStateCompact
      assetKey="update"
      title="Updates"
      description="Feature is disabled, you can enable it in settings"
      actions={
        canEnable
          ? [
              {
                label: "Turn on Project Updates",
                onClick: () => {
                  router.push(`/${workspaceSlug}/projects/${projectId}/settings/project-updates`);
                },
                variant: "primary",
              },
            ]
          : []
      }
      rootClassName="p-10"
    />
  );
});
