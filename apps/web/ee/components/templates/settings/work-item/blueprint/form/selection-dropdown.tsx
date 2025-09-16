import { observer } from "mobx-react";
import { Controller, FieldPath, FieldValues, useFormContext } from "react-hook-form";
// plane imports
import { ChevronRight } from "lucide-react";
import { IIssueType } from "@plane/types";
import { cn, TProjectBlueprintDetails } from "@plane/utils";
// hooks
import { ProjectDropdownBase } from "@/components/dropdowns/project/base";
import { getNestedError } from "@/helpers/react-hook-form.helper";
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// plane web imports
import { IssueTypeDropdown } from "@/plane-web/components/issue-types/dropdowns/issue-type";
import {
  COMMON_BUTTON_CLASS_NAME,
  COMMON_ERROR_CLASS_NAME,
} from "@/plane-web/components/templates/settings/common/helpers";
import { useIssueTypes } from "@/plane-web/hooks/store";

type TUseMobxData = {
  usePropsForAdditionalData: false;
};

type TUsePropsData = {
  getWorkItemTypes: (projectId: string, activeOnly: boolean) => Record<string, IIssueType>;
  isWorkItemTypeEnabled?: boolean;
  isWorkItemTypeInitializing?: boolean;
  usePropsForAdditionalData: true;
};

type TSelectionDropdownProps<T extends FieldValues> = {
  allowProjectSelection?: boolean;
  fieldPaths: {
    projectId: FieldPath<T>;
    issueTypeId: FieldPath<T>;
  };
  getProjectById: (projectId: string | undefined | null) => TProjectBlueprintDetails | undefined;
  handleProjectChange?: (projectId: string) => void;
  projectId: string | undefined | null;
  projectIds?: string[];
  workspaceSlug: string;
} & (TUseMobxData | TUsePropsData);

export const SelectionDropdown = observer(<T extends FieldValues>(props: TSelectionDropdownProps<T>) => {
  const {
    allowProjectSelection,
    fieldPaths,
    getProjectById,
    handleProjectChange,
    projectId,
    projectIds,
    workspaceSlug,
  } = props;
  // form context
  const {
    control,
    formState: { errors },
  } = useFormContext<T>();
  // context hooks
  const { allowedProjectIds } = useIssueModal();
  // store hooks
  const { isWorkItemTypeEnabledForProject, getProjectIssueTypes, loader: workItemTypeLoader } = useIssueTypes();
  // derived values
  const projectIdError = getNestedError(errors, fieldPaths.projectId);
  const issueTypeIdError = getNestedError(errors, fieldPaths.issueTypeId);
  const additionalProps = props.usePropsForAdditionalData
    ? {
        getWorkItemTypes: props.getWorkItemTypes,
        isWorkItemTypeEnabled: props.isWorkItemTypeEnabled,
        isWorkItemTypeInitializing: props.isWorkItemTypeInitializing,
      }
    : {
        getWorkItemTypes: getProjectIssueTypes,
        isWorkItemTypeEnabled: projectId ? isWorkItemTypeEnabledForProject(workspaceSlug, projectId) : false,
        isWorkItemTypeInitializing: workItemTypeLoader === "init-loader",
      };

  if (!allowProjectSelection && !additionalProps.isWorkItemTypeEnabled) return null;
  return (
    <div className="flex items-center gap-x-1 pb-2">
      {/* Project Select */}
      {allowProjectSelection && (
        <div className="space-y-1">
          <Controller
            control={control}
            name={fieldPaths.projectId}
            rules={{
              required: true,
            }}
            render={({ field: { value, onChange } }) => (
              <div className="h-7">
                <ProjectDropdownBase
                  value={value}
                  onChange={(projectId) => {
                    onChange(projectId);
                    handleProjectChange?.(projectId);
                  }}
                  multiple={false}
                  buttonVariant="border-with-text"
                  buttonClassName={cn(COMMON_BUTTON_CLASS_NAME, {
                    [COMMON_ERROR_CLASS_NAME]: Boolean(projectIdError),
                  })}
                  renderCondition={(projectId) => allowedProjectIds.includes(projectId)}
                  getProjectById={getProjectById}
                  disabled={!allowProjectSelection}
                  projectIds={projectIds || []}
                />
              </div>
            )}
          />
        </div>
      )}
      {/* Issue Type Select */}
      {projectId && additionalProps.isWorkItemTypeEnabled && (
        <>
          {allowProjectSelection && (
            <div className="flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-300" aria-hidden="true" />
            </div>
          )}
          <div className="space-y-1">
            <Controller
              control={control}
              name={fieldPaths.issueTypeId}
              rules={{
                required: true,
              }}
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  <IssueTypeDropdown
                    buttonClassName={cn(COMMON_BUTTON_CLASS_NAME, {
                      [COMMON_ERROR_CLASS_NAME]: Boolean(issueTypeIdError),
                    })}
                    handleIssueTypeChange={(issueTypeId) => {
                      onChange(issueTypeId);
                    }}
                    issueTypeId={value}
                    projectId={projectId}
                    variant="sm"
                    {...additionalProps}
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
