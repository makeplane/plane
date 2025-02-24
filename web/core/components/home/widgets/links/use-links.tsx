import { useMemo } from "react";
import { useTranslation } from "@plane/i18n";
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
  const { t } = useTranslation();

  const linkOperations: TLinkOperations = useMemo(
    () => ({
      create: async (data: Partial<TProjectLink>) => {
        try {
          if (!workspaceSlug) throw new Error("Missing required fields");
          await createLink(workspaceSlug, data);
          setToast({
            message: t("links.toasts.created.message"),
            type: TOAST_TYPE.SUCCESS,
            title: t("links.toasts.created.title"),
          });
          toggleLinkModal(false);
        } catch (error: any) {
          console.error("error", error?.data?.error);
          setToast({
            message: error?.data?.error ?? t("links.toasts.not_created.message"),
            type: TOAST_TYPE.ERROR,
            title: t("links.toasts.not_created.title"),
          });
          throw error;
        }
      },
      update: async (linkId: string, data: Partial<TProjectLink>) => {
        try {
          if (!workspaceSlug) throw new Error("Missing required fields");
          await updateLink(workspaceSlug, linkId, data);
          setToast({
            message: t("links.toasts.updated.message"),
            type: TOAST_TYPE.SUCCESS,
            title: t("links.toasts.updated.title"),
          });
          toggleLinkModal(false);
        } catch (error: any) {
          setToast({
            message: error?.data?.error ?? t("links.toasts.not_updated.message"),
            type: TOAST_TYPE.ERROR,
            title: t("links.toasts.not_updated.title"),
          });
          throw error;
        }
      },
      remove: async (linkId: string) => {
        try {
          if (!workspaceSlug) throw new Error("Missing required fields");
          await removeLink(workspaceSlug, linkId);
          setToast({
            message: t("links.toasts.removed.message"),
            type: TOAST_TYPE.SUCCESS,
            title: t("links.toasts.removed.message"),
          });
        } catch (error: any) {
          setToast({
            message: error?.data?.error ?? t("links.toasts.not_removed.message"),
            type: TOAST_TYPE.ERROR,
            title: t("links.toasts.not_removed.title"),
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
