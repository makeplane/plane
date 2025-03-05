import { useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import { ETemplateLevel, EUserPermissionsLevel, EUserProjectRoles, EUserWorkspaceRoles } from "@plane/constants";
import { TBaseTemplateWithData } from "@plane/types";
// components
import { Button } from "@plane/ui";
// plane web imports
import { useUserPermissions, useWorkspace } from "@/hooks/store";
import { IBaseTemplateStore } from "@/plane-web/store/templates";
// local imports
import { TemplateQuickActions } from "./quick-actions";

type TemplateListItemProps<T extends TBaseTemplateWithData> = {
  templateId: string;
  workspaceSlug: string;
  currentLevel: ETemplateLevel;
  getTemplateById: IBaseTemplateStore<T>["getTemplateById"];
  deleteTemplate: (templateId: string) => Promise<void>;
  handleUseTemplateAction: () => void;
};

export const TemplateListItem = observer(<T extends TBaseTemplateWithData>(props: TemplateListItemProps<T>) => {
  const { templateId, workspaceSlug, currentLevel, getTemplateById, deleteTemplate, handleUseTemplateAction } = props;
  // refs
  const parentRef = useRef<HTMLDivElement>(null);
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const template = getTemplateById(templateId);
  const workspace = getWorkspaceBySlug(workspaceSlug);
  // Check if editing is allowed based on the current currentLevel
  const isEditingAllowed =
    currentLevel === ETemplateLevel.WORKSPACE
      ? allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE)
      : allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
  // If current currentLevel is workspace, template should not have a project, otherwise it should have a project (project currentLevel template)
  const isCurrentLevelTemplate = currentLevel === ETemplateLevel.WORKSPACE ? !template?.project : !!template?.project;
  const shouldShowQuickActions = isCurrentLevelTemplate && isEditingAllowed;

  if (!template || !workspace) return null;
  return (
    <div className="flex items-center justify-between gap-4 p-3 border border-custom-border-200 rounded-lg bg-custom-background-90/60">
      <div className="flex flex-col w-full truncate">
        <div className="text-sm font-medium text-custom-text-100 truncate">{template.name}</div>
        {template.description_html && (
          <div className="text-xs font-medium text-custom-text-300 truncate">{template.description_html}</div>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-3">
        {currentLevel === ETemplateLevel.PROJECT && !template.project && (
          <span className="text-xs text-custom-text-300">Derived from workspace</span>
        )}
        {currentLevel === ETemplateLevel.WORKSPACE && template.project && (
          <span className="text-xs text-custom-text-300">Derived from project</span>
        )}
        <Button
          variant="neutral-primary"
          className="rounded py-1 focus:bg-custom-background-100 focus:text-custom-text-200"
          size="sm"
          onClick={handleUseTemplateAction}
        >
          Use template
        </Button>
        {shouldShowQuickActions && (
          <TemplateQuickActions
            templateId={templateId}
            workspaceSlug={workspaceSlug}
            parentRef={parentRef}
            isEditingAllowed={isEditingAllowed}
            getTemplateById={getTemplateById}
            deleteTemplate={deleteTemplate}
          />
        )}
      </div>
    </div>
  );
});
