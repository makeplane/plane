"use client";

import React from "react";
import { Command } from "cmdk";
import { Search, X } from "lucide-react";
// plane imports
import { cn } from "@plane/utils";
// plane web imports
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";

interface ICommandInputHeaderProps {
  placeholder: string;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  baseTabIndex: number;
  searchInIssue?: boolean;
  issueDetails?: {
    id: string;
    project_id: string | null;
  } | null;
  onClearSearchInIssue?: () => void;
}

export const CommandInputHeader: React.FC<ICommandInputHeaderProps> = (props) => {
  const {
    placeholder,
    searchTerm,
    onSearchTermChange,
    baseTabIndex,
    searchInIssue = false,
    issueDetails,
    onClearSearchInIssue,
  } = props;

  return (
    <div className="relative flex items-center px-4 border-0 border-b border-custom-border-200">
      <div className="flex items-center gap-2 flex-shrink-0">
        <Search className="h-4 w-4 text-custom-text-200 flex-shrink-0" aria-hidden="true" strokeWidth={2} />
        {searchInIssue && issueDetails && (
          <>
            <span className="flex items-center text-sm">Update in:</span>
            <span className="flex items-center gap-1 rounded px-1.5 py-1 text-sm bg-custom-primary-100/10">
              {issueDetails.project_id && (
                <IssueIdentifier
                  issueId={issueDetails.id}
                  projectId={issueDetails.project_id}
                  textContainerClassName="text-sm text-custom-primary-200"
                />
              )}
              <X size={12} strokeWidth={2} className="flex-shrink-0 cursor-pointer" onClick={onClearSearchInIssue} />
            </span>
          </>
        )}
      </div>
      <Command.Input
        className={cn(
          "w-full bg-transparent p-4 text-sm text-custom-text-100 outline-none placeholder:text-custom-text-400 focus:ring-0"
        )}
        placeholder={placeholder}
        value={searchTerm}
        onValueChange={onSearchTermChange}
        autoFocus
        tabIndex={baseTabIndex}
      />
    </div>
  );
};
