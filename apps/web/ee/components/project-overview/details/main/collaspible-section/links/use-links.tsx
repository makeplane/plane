import { useMemo } from "react";
import { TProjectLink } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { useProject } from "@/hooks/store";
import { useProjectLinks } from "@/plane-web/hooks/store";

export type TLinkOperations = {
  create: (data: Partial<TProjectLink>) => Promise<void>;
  update: (linkId: string, data: Partial<TProjectLink>) => Promise<void>;
  remove: (linkId: string) => Promise<void>;
};
export type TProjectLinkRoot = {
  workspaceSlug: string;
  projectId: string;
};

export const useLinks = (workspaceSlug: string, projectId: string) => {
  // hooks
  const { createLink, updateLink, removeLink, isLinkModalOpen, toggleLinkModal, linkData, setLinkData, fetchLinks } =
    useProjectLinks();

  const { setLastCollapsibleAction } = useProject();

  const handleLinkOperations: TLinkOperations = useMemo(
    () => ({
      create: async (data: Partial<TProjectLink>) => {
        try {
          if (!workspaceSlug || !projectId) throw new Error("Missing required fields");
          await createLink(workspaceSlug, projectId, data);
          setToast({
            message: "The link has been successfully created",
            type: TOAST_TYPE.SUCCESS,
            title: "Link created",
          });
          toggleLinkModal(false);
          setLastCollapsibleAction("links");
        } catch (error: any) {
          setToast({
            message: error?.data?.error ?? "The link could not be created",
            type: TOAST_TYPE.ERROR,
            title: "Link not created",
          });
          throw error;
        }
      },
      update: async (linkId: string, data: Partial<TProjectLink>) => {
        try {
          if (!workspaceSlug || !projectId) throw new Error("Missing required fields");
          await updateLink(workspaceSlug, projectId, linkId, data);
          setToast({
            message: "The link has been successfully updated",
            type: TOAST_TYPE.SUCCESS,
            title: "Link updated",
          });
          toggleLinkModal(false);
        } catch (error) {
          setToast({
            message: "The link could not be updated",
            type: TOAST_TYPE.ERROR,
            title: "Link not updated",
          });
          throw error;
        }
      },
      remove: async (linkId: string) => {
        try {
          if (!workspaceSlug || !projectId) throw new Error("Missing required fields");
          await removeLink(workspaceSlug, projectId, linkId);
          setToast({
            message: "The link has been successfully removed",
            type: TOAST_TYPE.SUCCESS,
            title: "Link removed",
          });
          toggleLinkModal(false);
        } catch (error) {
          setToast({
            message: "The link could not be removed",
            type: TOAST_TYPE.ERROR,
            title: "Link not removed",
          });
        }
      },
    }),
    [workspaceSlug, projectId]
  );

  const handleOnClose = () => {
    toggleLinkModal(false);
  };

  return { handleLinkOperations, handleOnClose, isLinkModalOpen, toggleLinkModal, linkData, setLinkData, fetchLinks };
};
