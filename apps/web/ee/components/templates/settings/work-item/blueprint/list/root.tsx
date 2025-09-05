import { useState } from "react";
import { observer } from "mobx-react";
import { FieldPath, FieldValues, PathValue, useFormContext } from "react-hook-form";
import { PlusIcon } from "lucide-react";
// plane imports
import {
  EWorkItemTypeEntity,
  IIssueLabel,
  IIssueType,
  IModule,
  IState,
  IUserLite,
  TIssuePropertyValues,
  TWorkItemBlueprintFormData,
} from "@plane/types";
import { Button } from "@plane/ui";
import {
  mockCreateWorkItemBlueprint,
  TProjectBlueprintDetails,
  TWorkItemBlueprintFormDataListInvalid,
  TWorkItemSanitizationResult,
} from "@plane/utils";
// plane web imports
import { TemplateCollapsibleWrapper } from "@/plane-web/components/templates/settings/common";
// local imports
import { CreateUpdateWorkItemBlueprintModal } from "../modal/modal";
import { WorkItemBlueprintListItem } from "./list-item";

// Type constraint to ensure the field path points to TWorkItemBlueprintFormData[]
type WorkItemArrayFieldPath<T extends FieldValues> = {
  [K in FieldPath<T>]: PathValue<T, K> extends TWorkItemBlueprintFormData[] ? K : never;
}[FieldPath<T>];

type TWorkItemBlueprintListRootWithAdditionalPropsData = {
  usePropsForAdditionalData: true;
  getLabelById: (labelId: string) => IIssueLabel | null;
  getModuleById: (moduleId: string) => IModule | null;
  getStateById: (stateId: string | null | undefined) => IState | undefined;
  getUserDetails: (userId: string) => IUserLite | undefined;
  getProjectDefaultStateId: (projectId: string) => string | undefined;
  getProjectDefaultWorkItemTypeId: (projectId: string) => string | undefined;
  getWorkItemTypes: (projectId: string, activeOnly: boolean) => Record<string, IIssueType>;
  getWorkItemTypeById: (workItemTypeId: string) => IIssueType | undefined;
  isWorkItemTypeEntityEnabled: (workspaceSlug: string, projectId: string, entityType: EWorkItemTypeEntity) => boolean;
  labelIds: string[];
  memberIds: string[];
  moduleIds: string[];
  stateIds: string[];
};

type TWorkItemBlueprintListRootWithMobxData = {
  usePropsForAdditionalData: false;
};

type TWorkItemBlueprintListRootProps<T extends FieldValues> = {
  borderVariant?: "light" | "strong";
  emptyStateDescription: string;
  getProjectById: (projectId: string | undefined | null) => TProjectBlueprintDetails | undefined;
  handleWorkItemListInvalidIdsChange: (
    invalidIds: TWorkItemBlueprintFormDataListInvalid<TWorkItemBlueprintFormData[]>
  ) => void;
  modalInputBorderVariant?: "primary" | "true-transparent";
  modalTitle: string;
  projectId: string | null | undefined;
  sectionTitle: string;
  setWorkItemListCustomPropertyValues: (workItemId: string, customPropertyValues: TIssuePropertyValues) => void;
  workItemListCustomPropertyValues?: Record<string, TIssuePropertyValues>;
  workItemFieldPath: WorkItemArrayFieldPath<T>;
  workItemListInvalidIds?: TWorkItemBlueprintFormDataListInvalid<TWorkItemBlueprintFormData[]>;
  workspaceSlug: string;
} & (TWorkItemBlueprintListRootWithAdditionalPropsData | TWorkItemBlueprintListRootWithMobxData);

export const WorkItemBlueprintListRoot = observer(
  <T extends FieldValues>(props: TWorkItemBlueprintListRootProps<T>) => {
    const {
      borderVariant = "light",
      emptyStateDescription,
      handleWorkItemListInvalidIdsChange,
      modalInputBorderVariant = "true-transparent",
      modalTitle,
      projectId,
      sectionTitle,
      setWorkItemListCustomPropertyValues,
      workItemFieldPath,
      workItemListCustomPropertyValues,
      workItemListInvalidIds,
      workspaceSlug,
    } = props;
    // state
    const [showCreateUpdateWorkItemModal, setShowCreateUpdateWorkItemModal] = useState(false);
    const [selectedWorkItem, setSelectedWorkItem] = useState<Partial<TWorkItemBlueprintFormData> | null>(null);
    const [selectedWorkItemCustomPropertyValues, setSelectedWorkItemCustomPropertyValues] =
      useState<TIssuePropertyValues | null>(null);
    // form context
    const { watch, setValue } = useFormContext<T>();
    // derived values
    const workItems: TWorkItemBlueprintFormData[] = watch(workItemFieldPath) ?? [];
    const selectedWorkItemIndex = workItems.findIndex((item) => item.id === selectedWorkItem?.id);
    const selectedWorkItemInvalidIds = workItemListInvalidIds?.[selectedWorkItemIndex];
    const showEmptyState = workItems.length === 0;

    /**
     * Handles the creation or update of a work item
     * @param data - The data for the work item
     */
    const handleCreateUpdateWorkItem = async (
      data: TWorkItemBlueprintFormData,
      customPropertyValues: TIssuePropertyValues
    ) => {
      const newWorkItem = await mockCreateWorkItemBlueprint({
        workspaceSlug,
        projectId,
        data,
      });

      let updatedWorkItems: TWorkItemBlueprintFormData[];

      if (selectedWorkItem && selectedWorkItem.id) {
        // Update existing work item
        updatedWorkItems = workItems.map((item) => (item.id === selectedWorkItem.id ? newWorkItem : item));
      } else {
        // Create new work item
        updatedWorkItems = [...workItems, newWorkItem];
      }

      // no assertion needed since we know the types match
      setValue(workItemFieldPath, updatedWorkItems as PathValue<T, typeof workItemFieldPath>, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setWorkItemListCustomPropertyValues(newWorkItem.id, customPropertyValues);
      handleCloseCreateWorkItemModal();
    };

    /**
     * Handles the deletion of a work item
     * @param workItemId - The ID of the work item to delete
     */
    const handleDeleteWorkItem = (workItemId: string) => {
      const updatedWorkItems = workItems.filter((item) => item.id !== workItemId);
      setValue(workItemFieldPath, updatedWorkItems as PathValue<T, typeof workItemFieldPath>, {
        shouldValidate: true,
        shouldDirty: true,
      });
    };

    /**
     * Handles the preloading of data for the create/update modal
     * @param workItem - The work item to preload
     */
    const handleDataPreload = (workItem: TWorkItemBlueprintFormData) => {
      // preload the work item
      setSelectedWorkItem(workItem);
      // preload the custom property values
      if (workItemListCustomPropertyValues) {
        setSelectedWorkItemCustomPropertyValues(workItemListCustomPropertyValues[workItem.id] ?? null);
      }
    };

    /**
     * Handles the cleanup of the selected work item
     */
    const handleCleanup = () => {
      setSelectedWorkItem(null);
      setSelectedWorkItemCustomPropertyValues(null);
    };

    /**
     * Handles the closing of the create/update modal
     */
    const handleCloseCreateWorkItemModal = () => {
      setShowCreateUpdateWorkItemModal(false);
      handleCleanup();
    };

    /**
     * Handles the invalid ids change for the selected work item
     * @param key - The key of the invalid ids
     * @param invalidIds - The invalid ids
     */
    const handleInvalidIdsChange = <K extends keyof TWorkItemBlueprintFormData>(
      key: K,
      invalidIds: TWorkItemSanitizationResult<TWorkItemBlueprintFormData>["invalid"][K]
    ) => {
      // return if no selected work item or no work items
      if (!selectedWorkItem?.id || !workItems.length) {
        return;
      }

      // return if work item not found
      if (selectedWorkItemIndex < 0) {
        return;
      }

      // get current invalid ids for the selected work item (default to empty object if not found)
      const invalidIdsForSelectedWorkItem = selectedWorkItemInvalidIds || {};

      // create updated invalid ids object with proper fallback
      const updatedInvalidIds = {
        ...(workItemListInvalidIds || {}),
        [selectedWorkItemIndex]: {
          ...invalidIdsForSelectedWorkItem,
          [key]: invalidIds,
        },
      };

      // update the invalid ids for the selected work item
      handleWorkItemListInvalidIdsChange(updatedInvalidIds);
    };

    if (!projectId) return null;
    return (
      <>
        <CreateUpdateWorkItemBlueprintModal
          {...props}
          allowLabelCreation={false}
          allowProjectSelection={false}
          customPropertyValuesForPreload={selectedWorkItemCustomPropertyValues}
          dataForPreload={selectedWorkItem}
          handleInvalidIdsChange={handleInvalidIdsChange}
          inputBorderVariant={modalInputBorderVariant}
          isOpen={showCreateUpdateWorkItemModal}
          onClose={handleCloseCreateWorkItemModal}
          onSubmit={handleCreateUpdateWorkItem}
          title={modalTitle}
        />
        <TemplateCollapsibleWrapper
          title={sectionTitle}
          actionElement={({ setIsOpen }) => (
            <div className="flex items-center">
              <Button
                variant="link-neutral"
                onClick={(e) => {
                  e.preventDefault();
                  handleCleanup();
                  setShowCreateUpdateWorkItemModal(true);
                  setIsOpen(true);
                }}
              >
                <PlusIcon className="size-4" />
              </Button>
            </div>
          )}
          borderPosition="top"
          borderVariant={borderVariant}
        >
          <div className="flex flex-col gap-y-2 pt-2 pb-4">
            {showEmptyState && <div className="px-5 text-sm text-custom-text-300">{emptyStateDescription}</div>}
            {!showEmptyState &&
              workItems.map((workItem, index) => (
                <WorkItemBlueprintListItem
                  {...props}
                  allowEdit
                  key={workItem.id}
                  index={index}
                  workItem={workItem}
                  handleEdit={() => {
                    handleDataPreload(workItem);
                    setShowCreateUpdateWorkItemModal(true);
                  }}
                  handleDelete={() => {
                    handleDeleteWorkItem(workItem.id);
                  }}
                />
              ))}
          </div>
        </TemplateCollapsibleWrapper>
      </>
    );
  }
);
