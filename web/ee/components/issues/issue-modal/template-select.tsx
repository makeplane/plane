"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
// plane imports
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// ce imports
import { TWorkItemTemplateSelect } from "@/ce/components/issues";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// plane web imports
import { WorkItemTemplateDropdown } from "@/plane-web/components/templates/dropdowns";
import { useFlag } from "@/plane-web/hooks/store";

export const WorkItemTemplateSelect = observer((props: TWorkItemTemplateSelect) => {
  const {
    projectId,
    typeId,
    disabled = false,
    size = "sm",
    placeholder,
    renderChevron = false,
    dropDownContainerClassName,
    handleFormChange,
  } = props;
  // router
  const { workspaceSlug } = useParams();
  // issue modal context
  const { workItemTemplateId, isApplyingTemplate, setWorkItemTemplateId } = useIssueModal();
  // derived values
  const isTemplatesEnabled = useFlag(workspaceSlug?.toString(), "WORKITEM_TEMPLATES");

  return (
    <>
      {isTemplatesEnabled && (
        <>
          {renderChevron && (
            <div className="flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-300" aria-hidden="true" />
            </div>
          )}
          <div className={cn("h-7", dropDownContainerClassName)}>
            {isApplyingTemplate && <Loader.Item height="100%" width="120px" />}
            {!isApplyingTemplate && projectId && (
              <WorkItemTemplateDropdown
                templateId={workItemTemplateId}
                projectId={projectId}
                typeId={typeId}
                disabled={disabled}
                size={size}
                placeholder={placeholder}
                handleTemplateChange={(templateId) => {
                  setWorkItemTemplateId(templateId);
                  handleFormChange?.();
                }}
              />
            )}
          </div>
        </>
      )}
    </>
  );
});
