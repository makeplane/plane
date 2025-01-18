import { useMemo } from "react";
import { TProjectLink } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { useHome } from "@/hooks/store/use-home";

export type TLinkOperations = {
  create: (data: Partial<TProjectLink>) => Promise<void>;
  update: (linkId: string, data: Partial<TProjectLink>) => Promise<void>;
  remove: (linkId: string) => Promise<void>;
};
export type TProjectLinkRoot = {
  workspaceSlug: string;
};

export const useLinks = (workspaceSlug: string) => {
  // hooks
  const {
    quickLinks: {
      createLink,
      updateLink,
      removeLink,
      isLinkModalOpen,
      toggleLinkModal,
      linkData,
      setLinkData,
      fetchLinks,
    },
  } = useHome();

  const linkOperations: TLinkOperations = useMemo(
    () => ({
      create: async (data: Partial<TProjectLink>) => {
        try {
          if (!workspaceSlug) throw new Error("Missing required fields");
          await createLink(workspaceSlug, data);
          setToast({
            message: "The link has been successfully created",
            type: TOAST_TYPE.SUCCESS,
            title: "Link created",
          });
          toggleLinkModal(false);
        } catch (error: any) {
          console.error("error", error);
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
          if (!workspaceSlug) throw new Error("Missing required fields");
          await updateLink(workspaceSlug, linkId, data);
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
          if (!workspaceSlug) throw new Error("Missing required fields");
          await removeLink(workspaceSlug, linkId);
          setToast({
            message: "The link has been successfully removed",
            type: TOAST_TYPE.SUCCESS,
            title: "Link removed",
          });
        } catch (error) {
          setToast({
            message: "The link could not be removed",
            type: TOAST_TYPE.ERROR,
            title: "Link not removed",
          });
        }
      },
    }),
    [workspaceSlug]
  );

  const handleOnClose = () => {
    toggleLinkModal(false);
  };

  return { linkOperations, handleOnClose, isLinkModalOpen, toggleLinkModal, linkData, setLinkData, fetchLinks };
};
