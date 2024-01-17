import { FC, useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
// hooks
import { useIssueDetail } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { IssueLinkCreateUpdateModal } from "./create-update-link-modal";
import { IssueLinkList } from "./links";
// types
import { TIssueLink } from "@plane/types";

export type TLinkOperations = {
  create: (data: Partial<TIssueLink>) => Promise<void>;
  update: (linkId: string, data: Partial<TIssueLink>) => Promise<void>;
  remove: (linkId: string) => Promise<void>;
};

export type TIssueLinkRoot = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const IssueLinkRoot: FC<TIssueLinkRoot> = (props) => {
  // props
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  // hooks
  const { toggleIssueLinkModal: toggleIssueLinkModalStore, createLink, updateLink, removeLink } = useIssueDetail();
  // state
  const [isIssueLinkModal, setIsIssueLinkModal] = useState(false);
  const toggleIssueLinkModal = useCallback(
    (modalToggle: boolean) => {
      toggleIssueLinkModalStore(modalToggle);
      setIsIssueLinkModal(modalToggle);
    },
    [toggleIssueLinkModalStore]
  );

  const { setToastAlert } = useToast();

  const handleLinkOperations: TLinkOperations = useMemo(
    () => ({
      create: async (data: Partial<TIssueLink>) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await createLink(workspaceSlug, projectId, issueId, data);
          setToastAlert({
            message: "The link has been successfully created",
            type: "success",
            title: "Link created",
          });
          toggleIssueLinkModal(false);
        } catch (error) {
          setToastAlert({
            message: "The link could not be created",
            type: "error",
            title: "Link not created",
          });
        }
      },
      update: async (linkId: string, data: Partial<TIssueLink>) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await updateLink(workspaceSlug, projectId, issueId, linkId, data);
          setToastAlert({
            message: "The link has been successfully updated",
            type: "success",
            title: "Link updated",
          });
          toggleIssueLinkModal(false);
        } catch (error) {
          setToastAlert({
            message: "The link could not be updated",
            type: "error",
            title: "Link not updated",
          });
        }
      },
      remove: async (linkId: string) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await removeLink(workspaceSlug, projectId, issueId, linkId);
          setToastAlert({
            message: "The link has been successfully removed",
            type: "success",
            title: "Link removed",
          });
          toggleIssueLinkModal(false);
        } catch (error) {
          setToastAlert({
            message: "The link could not be removed",
            type: "error",
            title: "Link not removed",
          });
        }
      },
    }),
    [workspaceSlug, projectId, issueId, createLink, updateLink, removeLink, setToastAlert, toggleIssueLinkModal]
  );

  return (
    <>
      <IssueLinkCreateUpdateModal
        isModalOpen={isIssueLinkModal}
        handleModal={toggleIssueLinkModal}
        linkOperations={handleLinkOperations}
      />

      <div className="py-1 text-xs">
        <div className="flex items-center justify-between gap-2">
          <h4>Links</h4>
          {!disabled && (
            <button
              type="button"
              className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-custom-background-90 ${
                disabled ? "cursor-not-allowed" : "cursor-pointer"
              }`}
              onClick={() => toggleIssueLinkModal(true)}
              disabled={disabled}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        <div>
          <IssueLinkList issueId={issueId} linkOperations={handleLinkOperations} />
        </div>
      </div>
    </>
  );
};
