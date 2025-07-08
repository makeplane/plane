import { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/types";
import { cn } from "@plane/utils";
import { TIssueOperations } from "@/components/issues";
// helpers
// hooks
import { useIssueDetail } from "@/hooks/store";
import useKeypress from "@/hooks/use-keypress";
import usePeekOverviewOutsideClickDetector from "@/hooks/use-peek-overview-outside-click";
// plane web imports
import { useCustomers } from "@/plane-web/hooks/store";
import { useEpics } from "@/plane-web/hooks/store/epics/use-epics";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local imports
import { EpicDetailRoot } from "../details/root";
import { EpicPeekOverviewError } from "./error";
import { EpicPeekOverviewHeader, TPeekModes } from "./header";
import { EpicPeekOverviewLoader } from "./loader";

interface IEpicView {
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

export const EpicView: FC<IEpicView> = observer((props) => {
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
  const [deleteEpicModal, setDeleteEpicModal] = useState(false);
  const [editEpicModal, setEditEpicModal] = useState(false);
  const [duplicateEpicModal, setDuplicateEpicModal] = useState(false);
  // ref
  const issuePeekOverviewRef = useRef<HTMLDivElement>(null);
  // store hooks
  const {
    setPeekIssue,
    isAnyModalOpen,
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const {
    updatesStore: { deleteModalId },
  } = useEpics();
  const { setPeekIssue: setIssuePeekIssue } = useIssueDetail();
  const { isAnyModalOpen: isAnyIssueModalOpen } = useIssueDetail();
  const { isAnyModalOpen: isAnyCustomerModalOpen } = useCustomers();
  const {
    initiative: { isInitiativeModalOpen },
  } = useInitiatives();
  const issue = getIssueById(issueId);
  // remove peek id
  const removeRoutePeekId = () => {
    setIssuePeekIssue(undefined);
    setPeekIssue(undefined);
    if (embedIssue && embedRemoveCurrentNotification) embedRemoveCurrentNotification();
  };

  usePeekOverviewOutsideClickDetector(
    issuePeekOverviewRef,
    () => {
      if (!embedIssue) {
        if (
          !isAnyModalOpen &&
          !isAnyIssueModalOpen &&
          !deleteEpicModal &&
          !editEpicModal &&
          !deleteModalId &&
          !isAnyCustomerModalOpen &&
          !isInitiativeModalOpen &&
          !duplicateEpicModal
        ) {
          removeRoutePeekId();
        }
      }
    },
    issueId
  );

  const handleKeyDown = () => {
    const slashCommandDropdownElement = document.querySelector("#slash-command");
    const editorImageFullScreenModalElement = document.querySelector(".editor-image-full-screen-modal");
    const dropdownElement = document.activeElement?.tagName === "INPUT";
    if (!isAnyModalOpen && !slashCommandDropdownElement && !dropdownElement && !editorImageFullScreenModalElement) {
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
      "bottom-0 right-0 top-0 w-full lg:w-[1024px] border-0 border-l": peekMode === "side-peek",
      "size-5/6 top-[8.33%] left-[8.33%]": peekMode === "modal",
      "inset-0 m-4": peekMode === "full-screen",
    }
  );

  const toggleEditEpicModal = (value: boolean) => setEditEpicModal(value);
  const toggleDeleteEpicModal = (value: boolean) => setDeleteEpicModal(value);
  const toggleDuplicateEpicModal = (value: boolean) => setDuplicateEpicModal(value);
  return (
    <>
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
              <EpicPeekOverviewError removeRoutePeekId={removeRoutePeekId} />
            </div>
          ) : (
            isLoading && <EpicPeekOverviewLoader removeRoutePeekId={removeRoutePeekId} />
          )}
          {!isLoading && !isError && issue && (
            <>
              {/* header */}
              <EpicPeekOverviewHeader
                peekMode={peekMode}
                setPeekMode={(value) => setPeekMode(value)}
                removeRoutePeekId={removeRoutePeekId}
                toggleEditEpicModal={toggleEditEpicModal}
                toggleDeleteEpicModal={toggleDeleteEpicModal}
                toggleDuplicateEpicModal={toggleDuplicateEpicModal}
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
              <EpicDetailRoot
                workspaceSlug={workspaceSlug.toString()}
                projectId={projectId.toString()}
                epicId={issueId.toString()}
              />
            </>
          )}
        </div>
      )}
    </>
  );
});
