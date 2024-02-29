import { FC, useRef, useState } from "react";

import { observer } from "mobx-react-lite";

// hooks
import useOutsideClickDetector from "hooks/use-outside-click-detector";
import useKeypress from "hooks/use-keypress";
import useToast from "hooks/use-toast";
// store hooks
import { useIssueDetail } from "hooks/store";
// components
import {
  DeleteIssueModal,
  IssuePeekOverviewHeader,
  TPeekModes,
  PeekOverviewIssueDetails,
  PeekOverviewProperties,
  TIssueOperations,
  ArchiveIssueModal,
} from "components/issues";
import { IssueActivity } from "../issue-detail/issue-activity";
// ui
import { Spinner } from "@plane/ui";

interface IIssueView {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  isLoading?: boolean;
  is_archived: boolean;
  disabled?: boolean;
  issueOperations: TIssueOperations;
}

export const IssueView: FC<IIssueView> = observer((props) => {
  const { workspaceSlug, projectId, issueId, isLoading, is_archived, disabled = false, issueOperations } = props;
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
    issue: { getIssueById },
  } = useIssueDetail();
  const issue = getIssueById(issueId);
  // hooks
  const { alerts } = useToast();
  // remove peek id
  const removeRoutePeekId = () => {
    setPeekIssue(undefined);
  };

  useOutsideClickDetector(issuePeekOverviewRef, () => {
    if (!isAnyModalOpen && (!alerts || alerts.length === 0)) {
      removeRoutePeekId();
    }
  });
  const handleKeyDown = () => {
    if (!isAnyModalOpen) {
      removeRoutePeekId();
      const issueElement = document.getElementById(`issue-${issueId}`);
      if (issueElement) issueElement?.focus();
    }
  };
  useKeypress("Escape", handleKeyDown);

  const handleRestore = async () => {
    if (!issueOperations.restore) return;
    await issueOperations.restore(workspaceSlug, projectId, issueId);
    removeRoutePeekId();
  };

  return (
    <>
      {issue && !is_archived && (
        <ArchiveIssueModal
          isOpen={isArchiveIssueModalOpen}
          handleClose={() => toggleArchiveIssueModal(false)}
          data={issue}
          onSubmit={async () => {
            if (issueOperations.archive) await issueOperations.archive(workspaceSlug, projectId, issueId);
            removeRoutePeekId();
          }}
        />
      )}

      {issue && !is_archived && (
        <DeleteIssueModal
          isOpen={isDeleteIssueModalOpen}
          handleClose={() => {
            toggleDeleteIssueModal(false);
            removeRoutePeekId();
          }}
          data={issue}
          onSubmit={() => issueOperations.remove(workspaceSlug, projectId, issueId)}
        />
      )}

      {issue && is_archived && (
        <DeleteIssueModal
          data={issue}
          isOpen={isDeleteIssueModalOpen}
          handleClose={() => toggleDeleteIssueModal(false)}
          onSubmit={() => issueOperations.remove(workspaceSlug, projectId, issueId)}
        />
      )}

      <div className="w-full !text-base">
        {issueId && (
          <div
            ref={issuePeekOverviewRef}
            className={`fixed z-20 flex flex-col overflow-hidden rounded border border-custom-border-200 bg-custom-background-100 transition-all duration-300 
          ${peekMode === "side-peek" ? `bottom-0 right-0 top-0 w-full md:w-[50%]` : ``}
          ${peekMode === "modal" ? `left-[50%] top-[50%] h-5/6 w-5/6 -translate-x-[50%] -translate-y-[50%]` : ``}
          ${peekMode === "full-screen" ? `bottom-0 left-0 right-0 top-0 m-4` : ``}
          `}
            style={{
              boxShadow:
                "0px 4px 8px 0px rgba(0, 0, 0, 0.12), 0px 6px 12px 0px rgba(16, 24, 40, 0.12), 0px 1px 16px 0px rgba(16, 24, 40, 0.12)",
            }}
          >
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
            />
            {/* content */}
            <div className="relative h-full w-full overflow-hidden overflow-y-auto vertical-scrollbar scrollbar-md">
              {isLoading && !issue ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Spinner />
                </div>
              ) : (
                issue && (
                  <>
                    {["side-peek", "modal"].includes(peekMode) ? (
                      <div className="relative flex flex-col gap-3 px-8 py-5">
                        <PeekOverviewIssueDetails
                          workspaceSlug={workspaceSlug}
                          projectId={projectId}
                          issueId={issueId}
                          issueOperations={issueOperations}
                          disabled={disabled || is_archived}
                          isSubmitting={isSubmitting}
                          setIsSubmitting={(value) => setIsSubmitting(value)}
                        />

                        <PeekOverviewProperties
                          workspaceSlug={workspaceSlug}
                          projectId={projectId}
                          issueId={issueId}
                          issueOperations={issueOperations}
                          disabled={disabled || is_archived}
                        />

                        <IssueActivity workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} />
                      </div>
                    ) : (
                      <div className={`flex h-full w-full overflow-auto vertical-scrollbar`}>
                        <div className="relative h-full w-full space-y-6 overflow-auto p-4 py-5">
                          <div>
                            <PeekOverviewIssueDetails
                              workspaceSlug={workspaceSlug}
                              projectId={projectId}
                              issueId={issueId}
                              issueOperations={issueOperations}
                              disabled={disabled || is_archived}
                              isSubmitting={isSubmitting}
                              setIsSubmitting={(value) => setIsSubmitting(value)}
                            />

                            <IssueActivity workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} />
                          </div>
                        </div>
                        <div
                          className={`h-full !w-[400px] flex-shrink-0 border-l border-custom-border-200 p-4 py-5 ${
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
                  </>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
});
