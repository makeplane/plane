import { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import {
  DeleteIssueModal,
  IssuePeekOverviewHeader,
  TPeekModes,
  PeekOverviewIssueDetails,
  PeekOverviewProperties,
  TIssueOperations,
  ArchiveIssueModal,
  IssuePeekOverviewLoader,
  IssuePeekOverviewError,
  IssueDetailWidgets,
} from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail } from "@/hooks/store";
import useKeypress from "@/hooks/use-keypress";
import usePeekOverviewOutsideClickDetector from "@/hooks/use-peek-overview-outside-click";
// store hooks
import { IssueActivity } from "../issue-detail/issue-activity";

interface IIssueView {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  isLoading?: boolean;
  isError?: boolean;
  is_archived: boolean;
  disabled?: boolean;
  embedIssue?: boolean;
  embedRemoveCurrentNotification?: () => void;
  issueOperations: TIssueOperations;
}

export const IssueView: FC<IIssueView> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    issueId,
    isLoading,
    isError,
    is_archived,
    disabled = false,
    embedIssue = false,
    embedRemoveCurrentNotification,
    issueOperations,
  } = props;
  // states
  const [peekMode, setPeekMode] = useState<TPeekModes>("side-peek");
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  // ref
  const issuePeekOverviewRef = useRef<HTMLDivElement>(null);
  // store hooks
  const {
    setPeekIssue,
    isAnyModalOpen,
    isDeleteIssueModalOpen,
    isArchiveIssueModalOpen,
    toggleDeleteIssueModal,
    toggleArchiveIssueModal,
    issue: { getIssueById, getIsLocalDBIssueDescription },
  } = useIssueDetail();
  const issue = getIssueById(issueId);
  // remove peek id
  const removeRoutePeekId = () => {
    setPeekIssue(undefined);
    if (embedIssue && embedRemoveCurrentNotification) embedRemoveCurrentNotification();
  };

  const isLocalDBIssueDescription = getIsLocalDBIssueDescription(issueId);

  usePeekOverviewOutsideClickDetector(
    issuePeekOverviewRef,
    () => {
      if (!embedIssue) {
        if (!isAnyModalOpen) {
          removeRoutePeekId();
        }
      }
    },
    issueId
  );

  const handleKeyDown = () => {
    const slashCommandDropdownElement = document.querySelector("#slash-command");
    const dropdownElement = document.activeElement?.tagName === "INPUT";
    if (!isAnyModalOpen && !slashCommandDropdownElement && !dropdownElement) {
      removeRoutePeekId();
      const issueElement = document.getElementById(`issue-${issueId}`);
      if (issueElement) issueElement?.focus();
    }
  };

  useKeypress("Escape", () => !embedIssue && handleKeyDown());

  const handleRestore = async () => {
    if (!issueOperations.restore) return;
    await issueOperations.restore(workspaceSlug, projectId, issueId);
    removeRoutePeekId();
  };

  const peekOverviewIssueClassName = cn(
    !embedIssue
      ? "fixed z-20 flex flex-col overflow-hidden rounded border border-custom-border-200 bg-custom-background-100 transition-all duration-300"
      : `w-full h-full`,
    !embedIssue && {
      "bottom-0 right-0 top-0 w-full md:w-[50%] border-0 border-l": peekMode === "side-peek",
      "size-5/6 top-[8.33%] left-[8.33%]": peekMode === "modal",
      "inset-0 m-4": peekMode === "full-screen",
    }
  );

  return (
    <>
      {issue && !is_archived && (
        <ArchiveIssueModal
          isOpen={isArchiveIssueModalOpen === issueId}
          handleClose={() => toggleArchiveIssueModal(null)}
          data={issue}
          onSubmit={async () => {
            if (issueOperations.archive) await issueOperations.archive(workspaceSlug, projectId, issueId);
            removeRoutePeekId();
          }}
        />
      )}

      {issue && isDeleteIssueModalOpen === issue.id && (
        <DeleteIssueModal
          isOpen={!!isDeleteIssueModalOpen}
          handleClose={() => {
            toggleDeleteIssueModal(null);
          }}
          data={issue}
          onSubmit={async () => issueOperations.remove(workspaceSlug, projectId, issueId)}
        />
      )}

      <div className="w-full !text-base">
        {issueId && (
          <div
            ref={issuePeekOverviewRef}
            className={peekOverviewIssueClassName}
            style={{
              boxShadow:
                "0px 4px 8px 0px rgba(0, 0, 0, 0.12), 0px 6px 12px 0px rgba(16, 24, 40, 0.12), 0px 1px 16px 0px rgba(16, 24, 40, 0.12)",
            }}
          >
            {isError ? (
              <div className="relative h-screen w-full overflow-hidden">
                <IssuePeekOverviewError removeRoutePeekId={removeRoutePeekId} />
              </div>
            ) : (
              isLoading && <IssuePeekOverviewLoader removeRoutePeekId={removeRoutePeekId} />
            )}
            {!isLoading && !isError && issue && (
              <>
                {/* header */}
                <IssuePeekOverviewHeader
                  peekMode={peekMode}
                  setPeekMode={(value) => setPeekMode(value)}
                  removeRoutePeekId={removeRoutePeekId}
                  toggleDeleteIssueModal={toggleDeleteIssueModal}
                  toggleArchiveIssueModal={toggleArchiveIssueModal}
                  handleRestoreIssue={handleRestore}
                  isArchived={is_archived}
                  issueId={issueId}
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  isSubmitting={isSubmitting}
                  disabled={disabled}
                  embedIssue={embedIssue}
                />
                {/* content */}
                <div className="vertical-scrollbar scrollbar-md relative h-full w-full overflow-hidden overflow-y-auto">
                  {["side-peek", "modal"].includes(peekMode) ? (
                    <div className="relative flex flex-col gap-3 px-8 py-5 space-y-3">
                      <PeekOverviewIssueDetails
                        workspaceSlug={workspaceSlug}
                        projectId={projectId}
                        issueId={issueId}
                        issueOperations={issueOperations}
                        disabled={disabled || is_archived || isLocalDBIssueDescription}
                        isArchived={is_archived}
                        isSubmitting={isSubmitting}
                        setIsSubmitting={(value) => setIsSubmitting(value)}
                      />

                      <div className="py-2">
                        <IssueDetailWidgets
                          workspaceSlug={workspaceSlug}
                          projectId={projectId}
                          issueId={issueId}
                          disabled={disabled || is_archived}
                        />
                      </div>

                      <PeekOverviewProperties
                        workspaceSlug={workspaceSlug}
                        projectId={projectId}
                        issueId={issueId}
                        issueOperations={issueOperations}
                        disabled={disabled || is_archived}
                      />

                      <IssueActivity
                        workspaceSlug={workspaceSlug}
                        projectId={projectId}
                        issueId={issueId}
                        disabled={is_archived}
                      />
                    </div>
                  ) : (
                    <div className="vertical-scrollbar flex h-full w-full overflow-auto">
                      <div className="relative h-full w-full space-y-6 overflow-auto p-4 py-5">
                        <div className="space-y-3">
                          <PeekOverviewIssueDetails
                            workspaceSlug={workspaceSlug}
                            projectId={projectId}
                            issueId={issueId}
                            issueOperations={issueOperations}
                            disabled={disabled || is_archived || isLocalDBIssueDescription}
                            isArchived={is_archived}
                            isSubmitting={isSubmitting}
                            setIsSubmitting={(value) => setIsSubmitting(value)}
                          />

                          <div className="py-2">
                            <IssueDetailWidgets
                              workspaceSlug={workspaceSlug}
                              projectId={projectId}
                              issueId={issueId}
                              disabled={disabled}
                            />
                          </div>

                          <IssueActivity
                            workspaceSlug={workspaceSlug}
                            projectId={projectId}
                            issueId={issueId}
                            disabled={is_archived}
                          />
                        </div>
                      </div>
                      <div
                        className={`h-full !w-[400px] flex-shrink-0 border-l border-custom-border-200 p-4 py-5 overflow-hidden vertical-scrollbar scrollbar-sm ${
                          is_archived ? "pointer-events-none" : ""
                        }`}
                      >
                        <PeekOverviewProperties
                          workspaceSlug={workspaceSlug}
                          projectId={projectId}
                          issueId={issueId}
                          issueOperations={issueOperations}
                          disabled={disabled || is_archived}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
});
