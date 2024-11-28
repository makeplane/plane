"use client";
import { useMemo } from "react";
import { TIssueLink } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store";
// types
import { TLinkOperations } from "../../issue-detail/links";

export const useLinkOperations = (workspaceSlug: string, projectId: string, issueId: string): TLinkOperations => {
  const { createLink, updateLink, removeLink } = useIssueDetail();

  const handleLinkOperations: TLinkOperations = useMemo(
    () => ({
      create: async (data: Partial<TIssueLink>) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await createLink(workspaceSlug, projectId, issueId, data);
          setToast({
            message: "The link has been successfully created",
            type: TOAST_TYPE.SUCCESS,
            title: "Link created",
          });
        } catch (error: any) {
          setToast({
            message: error?.data?.error ?? "The link could not be created",
            type: TOAST_TYPE.ERROR,
            title: "Link not created",
          });
          throw error;
        }
      },
      update: async (linkId: string, data: Partial<TIssueLink>) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await updateLink(workspaceSlug, projectId, issueId, linkId, data);
          setToast({
            message: "The link has been successfully updated",
            type: TOAST_TYPE.SUCCESS,
            title: "Link updated",
          });
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
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await removeLink(workspaceSlug, projectId, issueId, linkId);
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
    [workspaceSlug, projectId, issueId, createLink, updateLink, removeLink]
  );

  return handleLinkOperations;
};
