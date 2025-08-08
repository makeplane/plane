import { observer } from "mobx-react";
import { FieldValues, useFormContext } from "react-hook-form";
// plane imports
import { EWorkItemTypeEntity } from "@plane/types";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// plane web imports
import { IssueAdditionalPropertiesBase } from "@/plane-web/components/issues/issue-modal/additional-properties-base";
import { DefaultWorkItemBlueprintProperties } from "@/plane-web/components/templates/settings/work-item/blueprint/form/default-properties";
import { SelectionDropdown } from "@/plane-web/components/templates/settings/work-item/blueprint/form/selection-dropdown";
import { WorkItemBlueprintDetails } from "@/plane-web/components/templates/settings/work-item/blueprint/form/work-item-details";
// local imports
import { TWorkItemBlueprintPropertiesWithAdditionalPropsProps } from "./common";

/**
 * This component is used to render the properties of a work item blueprint with additional props.
 * Required Issue Modal context to be available in the parent component.
 */
export const WorkItemBlueprintPropertiesWithAdditionalProps = observer(
  <T extends FieldValues>(props: TWorkItemBlueprintPropertiesWithAdditionalPropsProps<T>) => {
    const {
      fieldPaths,
      areCustomPropertiesInitializing,
      arePropertyValuesInitializing,
      isWorkItemTypeEntityEnabled,
      projectId,
      workspaceSlug,
      shouldLoadDefaultValues = false,
    } = props;
    // form state
    const { watch } = useFormContext<T>();
    // context hooks
    const { issuePropertyValues } = useIssueModal();

    return (
      <div className="space-y-2">
        {/* Project and Issue Type Selection */}
        <SelectionDropdown<T>
          {...props}
          usePropsForAdditionalData
          isWorkItemTypeEnabled={
            projectId ? isWorkItemTypeEntityEnabled(workspaceSlug, projectId, EWorkItemTypeEntity.WORK_ITEM) : false
          }
        />
        {/* Work Item Details */}
        <div className="flex flex-col gap-y-4 w-full">
          <WorkItemBlueprintDetails<T> {...props} usePropsForAdditionalData />
        </div>
        {/* Additional Properties */}
        {projectId && (
          <div className="space-y-3">
            <IssueAdditionalPropertiesBase
              entityType={EWorkItemTypeEntity.WORK_ITEM}
              {...props}
              areCustomPropertiesInitializing={areCustomPropertiesInitializing ?? false}
              arePropertyValuesInitializing={arePropertyValuesInitializing ?? false}
              issuePropertyValues={issuePropertyValues}
              issueTypeId={watch(fieldPaths.issueTypeId)}
              projectId={projectId}
              shouldLoadDefaultValues={shouldLoadDefaultValues}
            />
          </div>
        )}
        {/* Default Properties */}
        <DefaultWorkItemBlueprintProperties<T> {...props} usePropsForAdditionalData />
      </div>
    );
  }
);
