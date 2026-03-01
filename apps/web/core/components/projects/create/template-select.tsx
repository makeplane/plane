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
import { useParams } from "next/navigation";
import { Loader as Spinner } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { ProjectTemplateDropdown } from "@/components/templates/dropdowns";
import { useProjectCreation } from "@/plane-web/hooks/context/use-project-creation";
import { useFlag } from "@/plane-web/hooks/store";

type TProjectTemplateSelect = {
  disabled?: boolean;
  onClick?: () => void;
};

export const ProjectTemplateSelect = observer(function ProjectTemplateSelect(props: TProjectTemplateSelect) {
  const { disabled = false } = props;
  // router
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // project creation context
  const { projectTemplateId, isApplyingTemplate, setProjectTemplateId } = useProjectCreation();
  // derived values
  const isTemplatesEnabled = useFlag(workspaceSlug?.toString(), "PROJECT_TEMPLATES");
  const hasWorkspaceAdminPermission = allowPermissions(
    [EUserWorkspaceRoles.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug?.toString()
  );

  return (
    <>
      {isTemplatesEnabled && (
        <div>
          <ProjectTemplateDropdown
            workspaceSlug={workspaceSlug?.toString()}
            templateId={projectTemplateId}
            disabled={disabled}
            customLabelContent={isApplyingTemplate && <Spinner className="size-4 animate-spin" />}
            handleTemplateChange={(templateId) => {
              setProjectTemplateId(templateId);
            }}
            showCreateNewTemplate={hasWorkspaceAdminPermission}
          />
        </div>
      )}
    </>
  );
});
