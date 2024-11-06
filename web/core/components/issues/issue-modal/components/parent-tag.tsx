"use client";

import React from "react";
import { observer } from "mobx-react";
import { Control, Controller } from "react-hook-form";
import { X } from "lucide-react";
// types
import { ISearchIssueResponse, TIssue } from "@plane/types";
// constants
import { ETabIndices } from "@/constants/tab-indices";
// helpers
import { getTabIndex } from "@/helpers/tab-indices.helper";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";

type TIssueParentTagProps = {
  control: Control<TIssue>;
  selectedParentIssue: ISearchIssueResponse;
  handleFormChange: () => void;
  setSelectedParentIssue: (issue: ISearchIssueResponse | null) => void;
};

export const IssueParentTag: React.FC<TIssueParentTagProps> = observer((props) => {
  const { control, selectedParentIssue, handleFormChange, setSelectedParentIssue } = props;
  // store hooks
  const { isMobile } = usePlatformOS();

  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  return (
    <Controller
      control={control}
      name="parent_id"
      render={({ field: { onChange } }) => (
        <div className="flex w-min items-center gap-2 whitespace-nowrap rounded bg-custom-background-90 p-2 text-xs">
          <div className="flex items-center gap-2">
            <span
              className="block h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: selectedParentIssue.state__color,
              }}
            />
            <span className="flex-shrink-0 text-custom-text-200">
              {selectedParentIssue?.project_id && (
                <IssueIdentifier
                  projectId={selectedParentIssue.project_id}
                  issueTypeId={selectedParentIssue.type_id}
                  projectIdentifier={selectedParentIssue?.project__identifier}
                  issueSequenceId={selectedParentIssue.sequence_id}
                  textContainerClassName="text-xs"
                />
              )}
            </span>
            <span className="truncate font-medium">{selectedParentIssue.name.substring(0, 50)}</span>
            <button
              type="button"
              className="grid place-items-center"
              onClick={() => {
                onChange(null);
                handleFormChange();
                setSelectedParentIssue(null);
              }}
              tabIndex={getIndex("remove_parent")}
            >
              <X className="h-3 w-3 cursor-pointer" />
            </button>
          </div>
        </div>
      )}
    />
  );
});
