"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Loader as Spinner } from "lucide-react";
// plane imports
import { EUserPermissionsLevel, PROJECT_TEMPLATE_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
import { cn } from "@plane/utils";
// ce imports
import { TProjectTemplateSelect } from "@/ce/components/projects/create/template-select";
// helpers
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { ProjectTemplateDropdown } from "@/plane-web/components/templates/dropdowns";
import { useProjectCreation } from "@/plane-web/hooks/context/use-project-creation";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store";

export const ProjectTemplateSelect = observer((props: TProjectTemplateSelect) => {
  const { disabled = false, size = "sm", placeholder, dropDownContainerClassName, handleModalClose } = props;
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
        <div className={cn(dropDownContainerClassName)}>
          <ProjectTemplateDropdown
            workspaceSlug={workspaceSlug?.toString()}
            templateId={projectTemplateId}
            disabled={disabled}
            size={size}
            placeholder={placeholder ?? t("templates.dropdown.label.project")}
            customLabelContent={isApplyingTemplate && <Spinner className="size-4 animate-spin" />}
            handleTemplateChange={(templateId) => {
              captureClick({
                elementName: PROJECT_TEMPLATE_TRACKER_ELEMENTS.CREATE_PROJECT_MODAL_TEMPLATE_OPTION,
                context: {
                  id: templateId,
                },
              });
              setProjectTemplateId(templateId);
            }}
            handleRedirection={handleModalClose}
            showCreateNewTemplate={hasWorkspaceAdminPermission}
          />
        </div>
      )}
    </>
  );
});
