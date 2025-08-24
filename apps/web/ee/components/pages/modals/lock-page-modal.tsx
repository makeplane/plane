import { useState } from "react";
// plane imports
import { PROJECT_PAGE_TRACKER_EVENTS } from "@plane/constants";
import type { EditorRefApi } from "@plane/editor";
import { ToggleSwitch } from "@plane/ui";
import { getPageName } from "@plane/utils";
// hooks
import { usePageOperations } from "@/hooks/use-page-operations";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { ConfirmationModal } from "./confirmation-modal";

export const LockPageModal = ({
  editorRef,
  page,
  lockPageModal,
  setLockPageModal,
}: {
  editorRef: EditorRefApi | null | undefined;
  page: TPageInstance;
  lockPageModal: boolean;
  setLockPageModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [actionType, setActionType] = useState<boolean>(false);
  const { pageOperations } = usePageOperations({
    editorRef,
    page,
  });

  return (
    <ConfirmationModal
      isOpen={lockPageModal}
      onClose={() => setLockPageModal(false)}
      page={page}
      action={async () => pageOperations.toggleLock({ recursive: actionType })}
      title={`${page.is_locked ? "Unlock" : "Lock"} page`}
      contentText={
        <>
          <div>
            Do you want to {page.is_locked ? "unlock" : "lock"} all subpages of page -{" "}
            <span className="break-words break-all font-medium text-custom-text-100">{getPageName(page.name)}</span>?{" "}
            {page.is_locked
              ? "This will allow others to edit this page."
              : "This will prevent others from editing this page."}
          </div>
          <ToggleSwitch
            className="mt-4"
            value={actionType}
            onChange={() => {
              setActionType((prevActionType) => !prevActionType);
            }}
          />
        </>
      }
      successMessage={`Page ${page.is_locked ? "unlocked" : "locked"} successfully.`}
      errorMessage={`Page could not be ${page.is_locked ? "unlocked" : "locked"}. Please try again.`}
      eventName={page.is_locked ? PROJECT_PAGE_TRACKER_EVENTS.unlock : PROJECT_PAGE_TRACKER_EVENTS.lock}
    />
  );
};
