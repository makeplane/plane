import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react";
import { MoveRight, MoveDiagonal, Link2, Trash2, RotateCcw } from "lucide-react";
// ui
import { ArchiveIcon, CenterPanelIcon, CustomSelect, FullScreenPanelIcon, SidePanelIcon, Tooltip } from "@plane/ui";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
// hooks
import useToast from "hooks/use-toast";
// store hooks
import { useIssueDetail, useProjectState, useUser } from "hooks/store";
// helpers
import { cn } from "helpers/common.helper";
// components
import { IssueSubscription, IssueUpdateStatus } from "components/issues";
import { STATE_GROUPS } from "constants/state";

export type TPeekModes = "side-peek" | "modal" | "full-screen";

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

export type PeekOverviewHeaderProps = {
  peekMode: TPeekModes;
  setPeekMode: (value: TPeekModes) => void;
  removeRoutePeekId: () => void;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  isArchived: boolean;
  disabled: boolean;
  toggleDeleteIssueModal: (value: boolean) => void;
  toggleArchiveIssueModal: (value: boolean) => void;
  handleRestoreIssue: () => void;
  isSubmitting: "submitting" | "submitted" | "saved";
};

export const IssuePeekOverviewHeader: FC<PeekOverviewHeaderProps> = observer((props) => {
  const {
    peekMode,
    setPeekMode,
    workspaceSlug,
    projectId,
    issueId,
    isArchived,
    disabled,
    removeRoutePeekId,
    toggleDeleteIssueModal,
    toggleArchiveIssueModal,
    handleRestoreIssue,
    isSubmitting,
  } = props;
  // router
  const router = useRouter();
  // store hooks
  const { currentUser } = useUser();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getStateById } = useProjectState();
  // hooks
  const { setToastAlert } = useToast();
  // derived values
  const issueDetails = getIssueById(issueId);
  const stateDetails = issueDetails ? getStateById(issueDetails?.state_id) : undefined;
  const currentMode = PEEK_OPTIONS.find((m) => m.key === peekMode);

  const issueLink = `${workspaceSlug}/projects/${projectId}/${isArchived ? "archived-issues" : "issues"}/${issueId}`;

  const handleCopyText = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    copyUrlToClipboard(issueLink).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };
  const redirectToIssueDetail = () => {
    router.push({ pathname: `/${issueLink}` });
    removeRoutePeekId();
  };
  // auth
  const isArchivingAllowed = !isArchived && !disabled;
  const isInArchivableGroup =
    !!stateDetails && [STATE_GROUPS.completed.key, STATE_GROUPS.cancelled.key].includes(stateDetails?.group);
  const isRestoringAllowed = isArchived && !disabled;

  return (
    <div
      className={`relative flex items-center justify-between p-4 ${
        currentMode?.key === "full-screen" ? "border-b border-custom-border-200" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <button onClick={removeRoutePeekId}>
          <MoveRight className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
        </button>

        <button onClick={redirectToIssueDetail}>
          <MoveDiagonal className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
        </button>
        {currentMode && (
          <div className="flex flex-shrink-0 items-center gap-2">
            <CustomSelect
              value={currentMode}
              onChange={(val: any) => setPeekMode(val)}
              customButton={
                <button type="button" className="">
                  <currentMode.icon className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
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
          {currentUser && !isArchived && (
            <IssueSubscription workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} />
          )}
          <Tooltip tooltipContent="Copy link">
            <button type="button" onClick={handleCopyText}>
              <Link2 className="h-4 w-4 -rotate-45 text-custom-text-300 hover:text-custom-text-200" />
            </button>
          </Tooltip>
          {isArchivingAllowed && (
            <Tooltip
              tooltipContent={isInArchivableGroup ? "Archive" : "Only completed or canceled issues can be archived"}
            >
              <button
                type="button"
                className={cn("text-custom-text-300", {
                  "hover:text-custom-text-200": isInArchivableGroup,
                  "cursor-not-allowed text-custom-text-400": !isInArchivableGroup,
                })}
                onClick={() => {
                  if (!isInArchivableGroup) return;
                  toggleArchiveIssueModal(true);
                }}
              >
                <ArchiveIcon className="h-4 w-4" />
              </button>
            </Tooltip>
          )}
          {isRestoringAllowed && (
            <Tooltip tooltipContent="Restore">
              <button type="button" onClick={handleRestoreIssue}>
                <RotateCcw className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
              </button>
            </Tooltip>
          )}
          {!disabled && (
            <Tooltip tooltipContent="Delete">
              <button type="button" onClick={() => toggleDeleteIssueModal(true)}>
                <Trash2 className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
});
