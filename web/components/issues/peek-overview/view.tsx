import { FC, useRef, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { MoveRight, MoveDiagonal, Link2, Trash2 } from "lucide-react";
// hooks
import useOutsideClickDetector from "hooks/use-outside-click-detector";
import useKeypress from "hooks/use-keypress";
// store hooks
import { useIssueDetail, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import {
  DeleteArchivedIssueModal,
  DeleteIssueModal,
  IssueSubscription,
  IssueUpdateStatus,
  PeekOverviewIssueDetails,
  PeekOverviewProperties,
  TIssueOperations,
} from "components/issues";
import { IssueActivity } from "../issue-detail/issue-activity";
// ui
import { CenterPanelIcon, CustomSelect, FullScreenPanelIcon, SidePanelIcon, Spinner } from "@plane/ui";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";

interface IIssueView {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  isLoading?: boolean;
  is_archived: boolean;
  disabled?: boolean;
  issueOperations: TIssueOperations;
}

type TPeekModes = "side-peek" | "modal" | "full-screen";

const PEEK_OPTIONS: { key: TPeekModes; icon: any; title: string }[] = [
  {
    key: "side-peek",
    icon: SidePanelIcon,
    title: "Side Peek",
  },
  {
    key: "modal",
    icon: CenterPanelIcon,
    title: "Modal",
  },
  {
    key: "full-screen",
    icon: FullScreenPanelIcon,
    title: "Full Screen",
  },
];

export const IssueView: FC<IIssueView> = observer((props) => {
  const { workspaceSlug, projectId, issueId, isLoading, is_archived, disabled = false, issueOperations } = props;
  // router
  const router = useRouter();
  // states
  const [peekMode, setPeekMode] = useState<TPeekModes>("side-peek");
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  // ref
  const issuePeekOverviewRef = useRef<HTMLDivElement>(null);
  // store hooks
  const { setPeekIssue, isAnyModalOpen, isDeleteIssueModalOpen, toggleDeleteIssueModal } = useIssueDetail();
  const { currentUser } = useUser();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { setToastAlert } = useToast();
  // derived values
  const currentMode = PEEK_OPTIONS.find((m) => m.key === peekMode);
  const issue = getIssueById(issueId);

  const removeRoutePeekId = () => {
    setPeekIssue(undefined);
  };
  useOutsideClickDetector(issuePeekOverviewRef, () => !isAnyModalOpen && removeRoutePeekId());

  const redirectToIssueDetail = () => {
    router.push({
      pathname: `/${workspaceSlug}/projects/${projectId}/${is_archived ? "archived-issues" : "issues"}/${issueId}`,
    });
    removeRoutePeekId();
  };

  const handleCopyText = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    copyUrlToClipboard(
      `${workspaceSlug}/projects/${projectId}/${is_archived ? "archived-issues" : "issues"}/${issueId}`
    ).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  const handleKeyDown = () => !isAnyModalOpen && removeRoutePeekId();
  useKeypress("Escape", handleKeyDown);

  return (
    <>
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
        <DeleteArchivedIssueModal
          data={issue}
          isOpen={isDeleteIssueModalOpen}
          handleClose={() => toggleDeleteIssueModal(false)}
          onSubmit={() => issueOperations.remove(workspaceSlug, projectId, issueId)}
        />
      )}

      <div className="w-full truncate !text-base">
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
            <div
              className={`relative flex items-center justify-between p-4 ${
                currentMode?.key === "full-screen" ? "border-b border-custom-border-200" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <button onClick={removeRoutePeekId}>
                  <MoveRight className="h-4 w-4 text-custom-text-400 hover:text-custom-text-200" />
                </button>

                <button onClick={redirectToIssueDetail}>
                  <MoveDiagonal className="h-4 w-4 text-custom-text-400 hover:text-custom-text-200" />
                </button>
                {currentMode && (
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <CustomSelect
                      value={currentMode}
                      onChange={(val: any) => setPeekMode(val)}
                      customButton={
                        <button type="button" className="">
                          <currentMode.icon className="h-4 w-4 text-custom-text-400 hover:text-custom-text-200" />
                        </button>
                      }
                    >
                      {PEEK_OPTIONS.map((mode) => (
                        <CustomSelect.Option key={mode.key} value={mode.key}>
                          <div
                            className={`flex items-center gap-1.5 ${
                              currentMode.key === mode.key
                                ? "text-custom-text-200"
                                : "text-custom-text-400 hover:text-custom-text-200"
                            }`}
                          >
                            <mode.icon className="-my-1 h-4 w-4 flex-shrink-0" />
                            {mode.title}
                          </div>
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-x-4">
                <IssueUpdateStatus isSubmitting={isSubmitting} />
                <div className="flex items-center gap-4">
                  {currentUser && !is_archived && (
                    <IssueSubscription workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} />
                  )}
                  <button onClick={handleCopyText}>
                    <Link2 className="h-4 w-4 -rotate-45 text-custom-text-300 hover:text-custom-text-200" />
                  </button>
                  {!disabled && (
                    <button onClick={() => toggleDeleteIssueModal(true)}>
                      <Trash2 className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* content */}
            <div className="relative h-full w-full overflow-hidden overflow-y-auto">
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
                          disabled={disabled}
                          isSubmitting={isSubmitting}
                          setIsSubmitting={(value) => setIsSubmitting(value)}
                        />

                        <PeekOverviewProperties
                          workspaceSlug={workspaceSlug}
                          projectId={projectId}
                          issueId={issueId}
                          issueOperations={issueOperations}
                          disabled={disabled}
                        />

                        <IssueActivity
                          workspaceSlug={workspaceSlug}
                          projectId={projectId}
                          issueId={issueId}
                        />
                      </div>
                    ) : (
                      <div className={`flex h-full w-full overflow-auto`}>
                        <div className="relative h-full w-full space-y-6 overflow-auto p-4 py-5">
                          <div>
                            <PeekOverviewIssueDetails
                              workspaceSlug={workspaceSlug}
                              projectId={projectId}
                              issueId={issueId}
                              issueOperations={issueOperations}
                              disabled={disabled}
                              isSubmitting={isSubmitting}
                              setIsSubmitting={(value) => setIsSubmitting(value)}
                            />

                            <IssueActivity
                              workspaceSlug={workspaceSlug}
                              projectId={projectId}
                              issueId={issueId}
                            />
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
                            disabled={disabled}
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
