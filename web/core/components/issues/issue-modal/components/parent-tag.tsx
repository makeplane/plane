"use client";

import React from "react";
import { observer } from "mobx-react";
import { Control, Controller } from "react-hook-form";
import { X } from "lucide-react";
// types
import { ISearchIssueResponse, TIssue } from "@plane/types";
// helpers
import { getTabIndex } from "@/helpers/issue-modal.helper";

type TIssueParentTagProps = {
  control: Control<TIssue>;
  selectedParentIssue: ISearchIssueResponse;
  handleFormChange: () => void;
  setSelectedParentIssue: (issue: ISearchIssueResponse | null) => void;
};

export const IssueParentTag: React.FC<TIssueParentTagProps> = observer((props) => {
  const { control, selectedParentIssue, handleFormChange, setSelectedParentIssue } = props;

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
              {selectedParentIssue.project__identifier}-{selectedParentIssue.sequence_id}
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
              tabIndex={getTabIndex("remove_parent")}
            >
              <X className="h-3 w-3 cursor-pointer" />
            </button>
          </div>
        </div>
      )}
    />
  );
});
