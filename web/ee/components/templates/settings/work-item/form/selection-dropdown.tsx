import { useCallback } from "react";
import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { ChevronRight } from "lucide-react";
import { ETemplateLevel } from "@plane/constants";
import { PartialDeep, TWorkItemTemplateForm } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { ProjectDropdown } from "@/components/dropdowns";
// helpers
import { shouldRenderProject } from "@/helpers/project.helper";
// hooks
import { useProjectState, useUser } from "@/hooks/store";
// plane web imports
import { IssueTypeDropdown } from "@/plane-web/components/issue-types/dropdowns";
import { COMMON_BUTTON_CLASS_NAME, COMMON_ERROR_CLASS_NAME } from "@/plane-web/components/templates/settings/common";
import { useIssueTypes } from "@/plane-web/hooks/store";

type TSelectionDropdownProps = {
  workspaceSlug: string;
  projectId: string | null;
  templateId: string | undefined;
  defaultValueForReset: PartialDeep<TWorkItemTemplateForm>;
  currentLevel: ETemplateLevel;
};

export const SelectionDropdown = observer((props: TSelectionDropdownProps) => {
  const { workspaceSlug, projectId, templateId, defaultValueForReset, currentLevel } = props;
  // form context
  const {
    control,
    formState: { errors },
    watch,
    reset,
  } = useFormContext<TWorkItemTemplateForm>();
  // store hooks
  const { projectsWithCreatePermissions } = useUser();
  const { getProjectDefaultStateId } = useProjectState();
  const { isWorkItemTypeEnabledForProject, getProjectDefaultIssueType } = useIssueTypes();
  // derived values
  const isWorkItemTypeEnabled = !!projectId && isWorkItemTypeEnabledForProject(workspaceSlug, projectId);

  // Reset the form values when the projectId changes, apart from common fields
  const handleProjectChange = useCallback(
    (projectId: string) => {
      const templateData = watch("template");
      const workItemData = watch("work_item");
      // Get default state id and issue type id for the project
      const defaultStateId = getProjectDefaultStateId(projectId);
      const defaultIssueType = getProjectDefaultIssueType(projectId);

      reset({
        template: templateData,
        work_item: {
          ...defaultValueForReset.work_item,
          project_id: projectId,
          name: workItemData.name,
          description_html: workItemData.description_html,
          state_id: defaultStateId,
          type_id: defaultIssueType?.id,
        },
      });
    },
    [watch, getProjectDefaultStateId, getProjectDefaultIssueType, reset, defaultValueForReset]
  );

  return (
    <div className="flex items-center gap-x-1">
      {/* Project Select */}
      <div className="space-y-1">
        <Controller
          control={control}
          name="work_item.project_id"
          rules={{
            required: true,
          }}
          render={({ field: { value, onChange } }) => (
            <div className="h-7">
              <ProjectDropdown
                value={value}
                onChange={(projectId) => {
                  onChange(projectId);
                  handleProjectChange(projectId);
                }}
                multiple={false}
                buttonVariant="border-with-text"
                buttonClassName={cn(COMMON_BUTTON_CLASS_NAME, {
                  [COMMON_ERROR_CLASS_NAME]: Boolean(errors?.work_item?.project_id),
                })}
                renderCondition={(project) =>
                  shouldRenderProject(project) && !!projectsWithCreatePermissions?.[project.id]
                }
                disabled={currentLevel === ETemplateLevel.PROJECT || !!templateId}
              />
            </div>
          )}
        />
      </div>
      {/* Issue Type Select */}
      {projectId && isWorkItemTypeEnabled && (
        <>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-300" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <Controller
              control={control}
              name="work_item.type_id"
              rules={{
                required: true,
              }}
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  <IssueTypeDropdown
                    issueTypeId={value}
                    projectId={projectId}
                    handleIssueTypeChange={(issueTypeId) => {
                      onChange(issueTypeId);
                    }}
                    variant="sm"
                    buttonClassName={cn(COMMON_BUTTON_CLASS_NAME, {
                      [COMMON_ERROR_CLASS_NAME]: Boolean(errors?.work_item?.type_id),
                    })}
                  />
                </div>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
});
