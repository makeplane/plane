import { useMemo } from "react";
// Plane
import { setToast, TOAST_TYPE } from "@plane/ui";
// PLane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TInitiativeLink } from "@/plane-web/types/initiative";

export type TLinkOperations = {
  create: (data: Partial<TInitiativeLink>) => Promise<void>;
  update: (linkId: string, data: Partial<TInitiativeLink>) => Promise<void>;
  remove: (linkId: string) => Promise<void>;
};

export const useLinkOperations = (workspaceSlug: string, initiativeId: string) => {
  const {
    initiative: {
      initiativeLinks: { createInitiativeLink, updateInitiativeLink, deleteInitiativeLink, setIsLinkModalOpen },
    },
  } = useInitiatives();

  const handleLinkOperations: TLinkOperations = useMemo(
    () => ({
      create: async (data: Partial<TInitiativeLink>) => {
        try {
          if (!workspaceSlug || !initiativeId) throw new Error("Missing required fields");
          await createInitiativeLink(workspaceSlug, initiativeId, data);
          setToast({
            message: "The link has been successfully created",
            type: TOAST_TYPE.SUCCESS,
            title: "Link created",
          });
          setIsLinkModalOpen(false);
        } catch (error: any) {
          setToast({
            message: error?.data?.error ?? "The link could not be created",
            type: TOAST_TYPE.ERROR,
            title: "Link not created",
          });
          throw error;
        }
      },
      update: async (linkId: string, data: Partial<TInitiativeLink>) => {
        try {
          if (!workspaceSlug || !initiativeId) throw new Error("Missing required fields");
          await updateInitiativeLink(workspaceSlug, initiativeId, linkId, data);
          setToast({
            message: "The link has been successfully updated",
            type: TOAST_TYPE.SUCCESS,
            title: "Link updated",
          });
          setIsLinkModalOpen(false);
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
          if (!workspaceSlug || !initiativeId) throw new Error("Missing required fields");
          await deleteInitiativeLink(workspaceSlug, initiativeId, linkId);
          setToast({
            message: "The link has been successfully removed",
            type: TOAST_TYPE.SUCCESS,
            title: "Link removed",
          });
          setIsLinkModalOpen(false);
        } catch (error) {
          setToast({
            message: "The link could not be removed",
            type: TOAST_TYPE.ERROR,
            title: "Link not removed",
          });
        }
      },
    }),
    [workspaceSlug, initiativeId, createInitiativeLink, updateInitiativeLink, deleteInitiativeLink, setIsLinkModalOpen]
  );

  return handleLinkOperations;
};
