import { observer } from "mobx-react";
import { FieldValues, useFormContext } from "react-hook-form";
// plane imports
import { EWorkItemTypeEntity } from "@plane/types";
// hooks
import { useLabel } from "@/hooks/store";
// plane web imports
import { IssueAdditionalProperties } from "@/plane-web/components/issues/issue-modal/additional-properties";
import { DefaultWorkItemBlueprintProperties } from "@/plane-web/components/templates/settings/work-item/blueprint/form/default-properties";
import { SelectionDropdown } from "@/plane-web/components/templates/settings/work-item/blueprint/form/selection-dropdown";
import { WorkItemBlueprintDetails } from "@/plane-web/components/templates/settings/work-item/blueprint/form/work-item-details";
// local imports
import { TWorkItemBlueprintPropertiesWithMobxProps } from "./common";

/**
 * This component is used to render the properties of a work item blueprint with MobX integration.
 * Requires Issue Modal context to be available in the parent component.
 */
export const WorkItemBlueprintPropertiesWithMobx = observer(
  <T extends FieldValues>(props: TWorkItemBlueprintPropertiesWithMobxProps<T>) => {
    const { fieldPaths, projectId } = props;
    // form state
    const { watch } = useFormContext<T>();
    // store hooks
    const { createLabel } = useLabel();

    return (
      <div className="space-y-2">
        {/* Project and Issue Type Selection */}
        <SelectionDropdown<T> {...props} usePropsForAdditionalData={false} />
        {/* Work Item Details */}
        <div className="flex flex-col gap-y-4 w-full">
          <WorkItemBlueprintDetails<T> {...props} usePropsForAdditionalData={false} />
        </div>
        {/* Additional Properties */}
        {projectId && (
          <div className="space-y-3">
            <IssueAdditionalProperties
              {...props}
              entityType={EWorkItemTypeEntity.WORK_ITEM}
              issueId={undefined}
              issueTypeId={watch(fieldPaths.issueTypeId)}
              projectId={projectId}
            />
          </div>
        )}
        {/* Default Properties */}
        <DefaultWorkItemBlueprintProperties<T>
          {...props}
          createLabel={projectId ? createLabel.bind(createLabel, props.workspaceSlug, projectId) : undefined}
          usePropsForAdditionalData={false}
        />
      </div>
    );
  }
);
