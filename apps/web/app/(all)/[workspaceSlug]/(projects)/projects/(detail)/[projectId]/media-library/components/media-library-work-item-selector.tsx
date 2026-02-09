"use client";

import type { ChangeEvent } from "react";
import { Search } from "lucide-react";
import type { ISearchIssueResponse } from "@plane/types";
import { Button, Loader } from "@plane/ui";
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";

type Props = {
  selectedWorkItem: ISearchIssueResponse | null;
  workItemQuery: string;
  onQueryChange: (value: string) => void;
  results: ISearchIssueResponse[];
  isLoading: boolean;
  isDetailsLoading: boolean;
  error?: string | null;
  onSelect: (issue: ISearchIssueResponse) => void;
  onClear: () => void;
};

export const MediaLibraryWorkItemSelector = ({
  selectedWorkItem,
  workItemQuery,
  onQueryChange,
  results,
  isLoading,
  isDetailsLoading,
  error,
  onSelect,
  onClear,
}: Props) => (
  <div className="mb-4 rounded-lg border border-custom-border-200 bg-custom-background-90 p-4">
    <div className="text-xs font-semibold text-custom-text-100">Work item</div>
    {selectedWorkItem ? (
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: selectedWorkItem.state__color }}
          />
          <IssueIdentifier
            projectId={selectedWorkItem.project_id}
            issueTypeId={selectedWorkItem.type_id}
            projectIdentifier={selectedWorkItem.project__identifier}
            issueSequenceId={selectedWorkItem.sequence_id}
            textContainerClassName="text-xs text-custom-text-200"
          />
          <span className="truncate text-xs text-custom-text-100">{selectedWorkItem.name}</span>
        </div>
        <Button variant="neutral-primary" size="sm" onClick={onClear}>
          Change
        </Button>
      </div>
    ) : (
      <>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-custom-text-300" />
          <input
            type="text"
            value={workItemQuery}
            placeholder="Search work items"
            onChange={(event: ChangeEvent<HTMLInputElement>) => onQueryChange(event.target.value)}
            className="h-9 w-full rounded-md border border-custom-border-200 bg-custom-background-100 pl-9 pr-3 text-xs text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none"
          />
        </div>
        <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-custom-border-200 bg-custom-background-100">
          {isLoading ? (
            <Loader className="space-y-2 p-3">
              <Loader.Item height="24px" />
              <Loader.Item height="24px" />
              <Loader.Item height="24px" />
            </Loader>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-xs text-custom-text-300">No work items found.</div>
          ) : (
            results.map((issue) => (
              <button
                key={issue.id}
                type="button"
                onClick={() => onSelect(issue)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-custom-text-200 hover:bg-custom-background-80"
              >
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: issue.state__color }}
                />
                <IssueIdentifier
                  projectId={issue.project_id}
                  issueTypeId={issue.type_id}
                  projectIdentifier={issue.project__identifier}
                  issueSequenceId={issue.sequence_id}
                  textContainerClassName="text-xs text-custom-text-200"
                />
                <span className="truncate">{issue.name}</span>
              </button>
            ))
          )}
        </div>
      </>
    )}
    {error ? <div className="mt-2 text-xs text-red-500">{error}</div> : null}
    {isDetailsLoading ? (
      <div className="mt-2 text-[11px] text-custom-text-300">Loading work item details…</div>
    ) : null}
  </div>
);
