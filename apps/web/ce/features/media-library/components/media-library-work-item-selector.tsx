"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import type { ISearchIssueResponse } from "@plane/types";
import { Loader } from "@plane/ui";
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";

type Props = {
  selectedWorkItem: ISearchIssueResponse | null;
  results: ISearchIssueResponse[];
  isLoading: boolean;
  isDetailsLoading: boolean;
  workItemQuery: string;
  showCard?: boolean;
  error?: string | null;
  onSelect: (issue: ISearchIssueResponse) => void;
  onQueryChange: (value: string) => void;
  onClear: () => void;
};

export const MediaLibraryWorkItemSelector = ({
  selectedWorkItem,
  results,
  isLoading,
  isDetailsLoading,
  workItemQuery,
  showCard = true,
  error,
  onSelect,
  onQueryChange,
  onClear,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!containerRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  const selectorContent = (
    <>
      <div ref={containerRef} className={`relative ${showCard ? "mt-2" : ""}`}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className={`flex h-9 w-full items-center justify-between rounded-md border px-3 text-left ${
            isOpen ? "border-white bg-custom-background-100" : "border-custom-border-200 bg-custom-background-100"
          }`}
        >
          {selectedWorkItem ? (
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
          ) : (
            <span className="text-xs text-[#E5E7EB]">Select work item</span>
          )}
          <span className="flex items-center gap-1">
            {selectedWorkItem ? (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear selected work item"
                className="grid h-5 w-5 place-items-center rounded text-custom-text-300 hover:bg-custom-background-90 hover:text-custom-text-100"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onClear();
                  setIsOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  event.stopPropagation();
                  onClear();
                  setIsOpen(false);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </span>
            ) : null}
            <ChevronDown
              className={`h-4 w-4 flex-shrink-0 text-custom-text-300 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {isOpen ? (
          <div className="absolute left-0 top-full z-[80] mt-1 w-full rounded-md border border-custom-border-200 bg-custom-background-100 p-2 shadow-lg">
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-custom-text-400" />
              <input
                type="text"
                value={workItemQuery}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search work items"
                className="h-8 w-full rounded-md border border-custom-border-200 bg-custom-background-90 pl-8 pr-2 text-xs text-custom-text-100 placeholder:text-[#E5E7EB] focus:outline-none"
              />
            </div>
            <div className="max-h-40 overflow-y-auto rounded-md border border-custom-border-200 bg-custom-background-100">
              {isLoading ? (
                <Loader className="space-y-2 p-3">
                  <Loader.Item height="24px" />
                  <Loader.Item height="24px" />
                  <Loader.Item height="24px" />
                </Loader>
              ) : results.length === 0 ? (
                <div className="px-3 py-2 text-xs text-custom-text-300">No work items found.</div>
              ) : (
                results.map((issue) => {
                  const isSelected = selectedWorkItem?.id === issue.id;

                  return (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() => {
                        onSelect(issue);
                        setIsOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs ${
                        isSelected
                          ? "bg-custom-background-80 text-custom-text-100"
                          : "text-custom-text-200 hover:bg-custom-background-80"
                      }`}
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
                        textContainerClassName={
                          isSelected ? "text-xs text-custom-text-100" : "text-xs text-custom-text-200"
                        }
                      />
                      <span className="truncate">{issue.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
      {error ? <div className={`${showCard ? "mt-2" : "mt-1"} text-xs text-red-500`}>{error}</div> : null}
      {isDetailsLoading ? (
        <div className={`${showCard ? "mt-2" : "mt-1"} text-[11px] text-custom-text-300`}>
          Loading work item details…
        </div>
      ) : null}
    </>
  );

  if (!showCard) return selectorContent;

  return (
    <div className="mb-4 rounded-lg border border-custom-border-200 bg-custom-background-90 p-4">
      <div className="text-xs font-semibold text-custom-text-100">Work item (optional)</div>
      {selectorContent}
    </div>
  );
};
