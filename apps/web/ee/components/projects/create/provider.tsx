import React, { useCallback, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { DEFAULT_PROJECT_FORM_VALUES } from "@plane/constants";
import { extractAndSanitizeProjectCreationFormData } from "@plane/utils";
// store hooks
import { useMember } from "@/hooks/store/use-member";
// plane web imports
import {
  ProjectCreationContext,
  THandleTemplateChangeProps,
} from "@/plane-web/components/projects/create/project-creation-context";
import { useProjectTemplates, useWorkspaceProjectStates } from "@/plane-web/hooks/store";

export type TProjectCreationProviderProps = {
  templateId?: string;
  children: React.ReactNode;
};

export const ProjectCreationProvider = observer((props: TProjectCreationProviderProps) => {
  const { templateId, children } = props;
  // states
  const [projectTemplateId, setProjectTemplateId] = useState<string | null>(templateId ?? null);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState<boolean>(false);
  // store hooks
  const { getTemplateById } = useProjectTemplates();
  const {
    workspace: { getWorkspaceMemberIds },
  } = useMember();
  const { getProjectStateIdsByWorkspaceId } = useWorkspaceProjectStates();

  /**
   * Used to handle template change in work item modal
   */
  const handleTemplateChange = useCallback(
    async (props: THandleTemplateChangeProps) => {
      const { workspaceSlug, reset } = props;
      // check if work item template id is available
      if (!projectTemplateId) return;
      // get template details
      const template = getTemplateById(projectTemplateId);
      // handle local states
      setIsApplyingTemplate(true);

      if (template) {
        // Get the sanitized work item form data
        const { valid: sanitizedWorkItemFormData } = extractAndSanitizeProjectCreationFormData({
          projectData: template.template_data,
          workspaceSlug,
          getWorkspaceProjectStateIds: getProjectStateIdsByWorkspaceId,
          getWorkspaceMemberIds,
        });

        // reset form values
        reset({
          ...DEFAULT_PROJECT_FORM_VALUES,
          ...sanitizedWorkItemFormData,
        });
      }
      // set is applying template to false
      setIsApplyingTemplate(false);
    },
    [projectTemplateId, getTemplateById, getProjectStateIdsByWorkspaceId, getWorkspaceMemberIds]
  );

  return (
    <ProjectCreationContext.Provider
      value={{
        projectTemplateId,
        setProjectTemplateId,
        isApplyingTemplate,
        setIsApplyingTemplate,
        handleTemplateChange,
      }}
    >
      {children}
    </ProjectCreationContext.Provider>
  );
});
