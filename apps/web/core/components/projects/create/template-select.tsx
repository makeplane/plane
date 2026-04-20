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
import { Loader as Spinner } from "lucide-react";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { ProjectTemplateDropdown } from "@/components/templates/dropdowns";
import { useProjectCreation } from "@/plane-web/hooks/context/use-project-creation";
import { useFlag } from "@/plane-web/hooks/store";

type TProjectTemplateSelect = {
  onClick?: () => void;
  workspaceSlug: string;
};

export const ProjectTemplateSelect = observer(function ProjectTemplateSelect(props: TProjectTemplateSelect) {
  const { workspaceSlug } = props;
  // store hooks
  const { permissions: projectPermissions } = useProject();
  // project creation context
  const { projectTemplateId, isApplyingTemplate, setProjectTemplateId } = useProjectCreation();
  // derived values
  const isTemplatesEnabled = useFlag(workspaceSlug, "PROJECT_TEMPLATES");

  return (
    <>
      {isTemplatesEnabled && (
        <div>
          <ProjectTemplateDropdown
            workspaceSlug={workspaceSlug}
            templateId={projectTemplateId}
            canCreateTemplate={projectPermissions.getCanCreateTemplate(workspaceSlug)}
            customLabelContent={isApplyingTemplate && <Spinner className="size-4 animate-spin" />}
            handleTemplateChange={(templateId) => {
              setProjectTemplateId(templateId);
            }}
          />
        </div>
      )}
    </>
  );
});
