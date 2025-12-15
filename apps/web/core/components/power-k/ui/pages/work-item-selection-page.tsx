import React, { useState, useEffect } from "react";
// plane imports
// import { useTranslation } from "@plane/i18n";
import type { TIssueEntityData, TIssueSearchResponse, TActivityEntityData } from "@plane/types";
// import { generateWorkItemLink } from "@plane/utils";
// components
// import { CommandPaletteEntityList } from "@/components/command-palette";
// import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// hooks
// import { useCommandPalette } from "@/hooks/store/use-command-palette";
// import { usePowerK } from "@/hooks/store/use-power-k";
// import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
// import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
import { WorkspaceService } from "@/plane-web/services";

const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string | undefined;
  projectId: string | undefined;
  searchTerm: string;
  debouncedSearchTerm: string;
  isLoading: boolean;
  isSearching: boolean;
  resolvedPath: string;
  isWorkspaceLevel?: boolean;
};

export function WorkItemSelectionPage(props: Props) {
  const { workspaceSlug, projectId, debouncedSearchTerm, isWorkspaceLevel = false } = props;
  // router
  // const router = useAppRouter();
  // plane hooks
  // const { t } = useTranslation();
  // store hooks
  // const { togglePowerKModal } = usePowerK();
  // states
  const [_recentIssues, setRecentIssues] = useState<TIssueEntityData[]>([]);
  const [_issueResults, setIssueResults] = useState<TIssueSearchResponse[]>([]);

  // Load recent issues when component mounts
  useEffect(() => {
    if (!workspaceSlug) return;

    workspaceService
      .fetchWorkspaceRecents(workspaceSlug.toString(), "issue")
      .then((res) =>
        setRecentIssues(res.map((r: TActivityEntityData) => r.entity_data as TIssueEntityData).slice(0, 10))
      )
      .catch(() => setRecentIssues([]));
  }, [workspaceSlug]);

  // Search issues based on search term
  useEffect(() => {
    if (!workspaceSlug || !debouncedSearchTerm) {
      setIssueResults([]);
      return;
    }

    workspaceService
      .searchEntity(workspaceSlug.toString(), {
        count: 10,
        query: debouncedSearchTerm,
        query_type: ["issue"],
        ...(!isWorkspaceLevel && projectId ? { project_id: projectId.toString() } : {}),
      })
      .then((res) => {
        setIssueResults(res.issue || []);
      })
      .catch(() => setIssueResults([]));
  }, [debouncedSearchTerm, workspaceSlug, projectId, isWorkspaceLevel]);

  if (!workspaceSlug) return null;

  return (
    <>
      {/* {searchTerm === "" ? (
        recentIssues.length > 0 ? (
          <CommandPaletteEntityList
            heading="Issues"
            items={recentIssues}
            getKey={(issue) => issue.id}
            getLabel={(issue) => `${issue.project_identifier}-${issue.sequence_id} ${issue.name}`}
            renderItem={(issue) => (
              <div className="flex items-center gap-2">
                {issue.project_id && (
                  <IssueIdentifier
                    projectId={issue.project_id}
                    projectIdentifier={issue.project_identifier}
                    issueSequenceId={issue.sequence_id}
                    textContainerClassName="text-13 text-secondary"
                  />
                )}
                <span className="truncate">{issue.name}</span>
              </div>
            )}
            onSelect={(issue) => {
              if (!issue.project_id) return;
              togglePowerKModal(false);
              router.push(
                generateWorkItemLink({
                  workspaceSlug: workspaceSlug.toString(),
                  projectId: issue.project_id,
                  issueId: issue.id,
                  projectIdentifier: issue.project_identifier,
                  sequenceId: issue.sequence_id,
                  isEpic: issue.is_epic,
                })
              );
            }}
            emptyText="Search for issue id or issue title"
          />
        ) : (
          <div className="px-3 py-8 text-center text-13 text-tertiary">Search for issue id or issue title</div>
        )
      ) : issueResults.length > 0 ? (
        <CommandPaletteEntityList
          heading="Issues"
          items={issueResults}
          getKey={(issue) => issue.id}
          getLabel={(issue) => `${issue.project__identifier}-${issue.sequence_id} ${issue.name}`}
          renderItem={(issue) => (
            <div className="flex items-center gap-2">
              {issue.project_id && issue.project__identifier && issue.sequence_id && (
                <IssueIdentifier
                  projectId={issue.project_id}
                  projectIdentifier={issue.project__identifier}
                  issueSequenceId={issue.sequence_id}
                  textContainerClassName="text-13 text-secondary"
                />
              )}
              <span className="truncate">{issue.name}</span>
            </div>
          )}
          onSelect={(issue) => {
            if (!issue.project_id) return;
            togglePowerKModal(false);
            router.push(
              generateWorkItemLink({
                workspaceSlug: workspaceSlug.toString(),
                projectId: issue.project_id,
                issueId: issue.id,
                projectIdentifier: issue.project__identifier,
                sequenceId: issue.sequence_id,
              })
            );
          }}
          emptyText={t("command_k.empty_state.search.title") as string}
        />
      ) : (
        !isLoading &&
        !isSearching && (
          <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
            <SimpleEmptyState title={t("command_k.empty_state.search.title")} assetPath={resolvedPath} />
          </div>
        )
      )} */}
    </>
  );
}
