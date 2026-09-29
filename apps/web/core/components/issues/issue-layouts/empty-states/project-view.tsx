/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user";

export const ProjectViewEmptyState = observer(function ProjectViewEmptyState() {
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { t } = useTranslation();
  const { allowPermissions } = useUserPermissions();

  // auth
  const isCreatingIssueAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <EmptyStateDetailed
      assetKey="work-item"
      title={t("issue_ui.project_view_empty.title")}
      description={t("issue_ui.project_view_empty.description")}
      actions={[
        {
          label: t("issue.new"),
          onClick: () => {
            toggleCreateIssueModal(true, EIssuesStoreType.PROJECT_VIEW);
          },
          disabled: !isCreatingIssueAllowed,
          variant: "primary",
        },
      ]}
    />
  );
});
