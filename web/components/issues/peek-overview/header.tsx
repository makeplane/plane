import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react";
import { MoveRight, MoveDiagonal, Link2, Trash2 } from "lucide-react";
// ui
import { CenterPanelIcon, CustomSelect, FullScreenPanelIcon, SidePanelIcon } from "@plane/ui";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
// hooks
import useToast from "hooks/use-toast";
// store hooks
import { useUser } from "hooks/store";
// components
import { IssueSubscription, IssueUpdateStatus } from "components/issues";

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
    isSubmitting,
  } = props;
  // router
  const router = useRouter();
  // store hooks
  const { currentUser } = useUser();
  // hooks
  const { setToastAlert } = useToast();
  // derived values
  const currentMode = PEEK_OPTIONS.find((m) => m.key === peekMode);

  const handleCopyText = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    copyUrlToClipboard(
      `${workspaceSlug}/projects/${projectId}/${isArchived ? "archived-issues" : "issues"}/${issueId}`
    ).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  const redirectToIssueDetail = () => {
    router.push({
      pathname: `/${workspaceSlug}/projects/${projectId}/${isArchived ? "archived-issues" : "issues"}/${issueId}`,
    });
    removeRoutePeekId();
  };

  return (
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
          {currentUser && !isArchived && (
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
  );
});
