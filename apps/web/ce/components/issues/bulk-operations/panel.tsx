"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssuePriorities, TBulkOperationsPayload } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
// helpers
import { cn } from "@plane/utils";
// components
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { DateDropdown } from "@/components/dropdowns/date";
import { CycleDropdown } from "@/components/dropdowns/cycle";
import { ModuleDropdown } from "@/components/dropdowns/module/dropdown";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";
import { useProject } from "@/hooks/store/use-project";

type Props = {
  className?: string;
};

export const BulkOperationsPanel: React.FC<Props> = observer((props) => {
  const { className } = props;
  const { t } = useTranslation();
  // router params
  const { workspaceSlug, projectId } = useParams();
  // state
  const [isUpdating, setIsUpdating] = useState(false);
  const [properties, setProperties] = useState<Partial<TBulkOperationsPayload["properties"]>>({});
  // store hooks
  const { selectedEntityIds, clearSelection } = useMultipleSelectStore();
  const { currentProjectDetails } = useProject();
  const {
    issues: { bulkUpdateProperties },
  } = useIssues(EIssuesStoreType.PROJECT);

  const selectedCount = selectedEntityIds.length;

  const handleUpdate = async () => {
    if (!workspaceSlug || !projectId || selectedCount === 0) return;

    // Check if any properties are set
    if (Object.keys(properties).length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select at least one property to update.",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await bulkUpdateProperties(workspaceSlug.toString(), projectId.toString(), {
        issue_ids: selectedEntityIds,
        properties,
      });

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: `${selectedCount} work item${selectedCount > 1 ? "s" : ""} updated successfully.`,
      });

      // Clear selection and properties
      clearSelection();
      setProperties({});
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to update work items. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    clearSelection();
    setProperties({});
  };

  const updateProperty = <K extends keyof TBulkOperationsPayload["properties"]>(
    key: K,
    value: TBulkOperationsPayload["properties"][K]
  ) => {
    setProperties((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={cn("sticky bottom-0 left-0 z-[2] px-3.5 py-3", className)}>
      <div className="w-full bg-custom-background-100 border border-custom-border-200 rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left side: Selected count */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-custom-text-200">
                {selectedCount} selected
              </span>
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-custom-background-80 rounded transition-colors"
                aria-label="Clear selection"
              >
                <X className="h-3.5 w-3.5 text-custom-text-300" />
              </button>
            </div>
          </div>

          {/* Center: Property dropdowns */}
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            {/* State */}
            <StateDropdown
              projectId={projectId?.toString()}
              value={properties.state_id ?? null}
              onChange={(val) => updateProperty("state_id", val)}
              buttonVariant="border-with-text"
              placeholder="State"
            />

            {/* Priority */}
            <PriorityDropdown
              value={properties.priority ?? null}
              onChange={(val: TIssuePriorities) => updateProperty("priority", val)}
              buttonVariant="border-with-text"
              placeholder="Priority"
            />

            {/* Assignees */}
            <MemberDropdown
              projectId={projectId?.toString()}
              value={properties.assignee_ids ?? []}
              onChange={(val: string[]) => updateProperty("assignee_ids", val)}
              buttonVariant="border-with-text"
              placeholder="Assignees"
              multiple
            />

            {/* Start Date */}
            <DateDropdown
              value={properties.start_date ?? null}
              onChange={(val) => updateProperty("start_date", val ? val.toString() : null)}
              buttonVariant="border-with-text"
              placeholder="Start date"
              minDate={null}
              maxDate={properties.target_date ? new Date(properties.target_date) : null}
            />

            {/* Due Date */}
            <DateDropdown
              value={properties.target_date ?? null}
              onChange={(val) => updateProperty("target_date", val ? val.toString() : null)}
              buttonVariant="border-with-text"
              placeholder="Due date"
              minDate={properties.start_date ? new Date(properties.start_date) : null}
              maxDate={null}
            />

            {/* Cycle (if enabled in project) */}
            {currentProjectDetails?.cycle_view && (
              <CycleDropdown
                projectId={projectId?.toString()}
                value={properties.cycle_id ?? null}
                onChange={(val) => updateProperty("cycle_id", val)}
                buttonVariant="border-with-text"
                placeholder="Cycle"
              />
            )}

            {/* Module (if enabled in project) */}
            {currentProjectDetails?.module_view && (
              <ModuleDropdown
                projectId={projectId?.toString()}
                value={properties.module_ids ?? []}
                onChange={(val: string[]) => updateProperty("module_ids", val)}
                buttonVariant="border-with-text"
                placeholder="Modules"
                multiple
              />
            )}
          </div>

          {/* Right side: Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="neutral-primary"
              size="sm"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdate}
              loading={isUpdating}
              disabled={isUpdating || Object.keys(properties).length === 0}
            >
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
