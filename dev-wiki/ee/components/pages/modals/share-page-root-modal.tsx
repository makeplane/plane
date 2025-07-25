"use client";

import React, { useState, useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// constants
import { EPageSharedUserAccess, EUserWorkspaceRoles } from "@plane/constants";
// plane imports
import { setToast, TOAST_TYPE, dismissToast } from "@plane/ui";
// helpers
import { getPageName } from "@plane/utils";
// hooks
import { useMember, useUser } from "@/hooks/store";
// plane web hooks
import { TPageShareFormUser } from "@/plane-web/hooks/pages/use-page-share-form";
import { useMemberOptions } from "@/plane-web/hooks/pages/use-shared-member-options";
import { usePageStore } from "@/plane-web/hooks/store";
// components
import { SharePageModal } from "../share/share-page-modal";
// types
import { TSharePageModalProps } from "../share/types";

export const SharePageRoolModal: React.FC<TSharePageModalProps> = observer(
  ({ isOpen, onClose, page, storeType, shareForm, isSharedUsersAccordionOpen, onToggleSharedUsersAccordion }) => {
    // store hooks
    const {
      workspace: { workspaceMemberIds, getWorkspaceMemberDetails },
    } = useMember();
    const { data: currentUser } = useUser();

    const { fetchPageSharedUsers, bulkUpdatePageSharedUsers } = usePageStore(storeType);

    // states
    const [copied, setCopied] = useState(false);

    const { isLoading: isLoadingSharedUsers } = useSWR(
      isOpen && page?.id ? `page-shared-users-${page.id}` : null,
      async () => {
        if (!page?.id) return null;

        await fetchPageSharedUsers(page.id);
      },
      {
        revalidateOnFocus: false,
        revalidateOnMount: true,
        revalidateOnReconnect: true,
        dedupingInterval: 5000,
        onError: () => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error fetching shared users",
            message: "Could not load page shared users. Please try again.",
          });
        },
      }
    );

    const { memberOptions } = useMemberOptions({
      workspaceMemberIds: workspaceMemberIds || [],
      currentUserId: currentUser?.id,
      sharedUsers: shareForm?.data?.sharedUsers || [],
      getWorkspaceMemberDetails,
    });

    const handleCopyLink = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Link copied",
          message: "Page link has been copied to clipboard.",
        });
      } catch (err) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Failed to copy link",
          message: "Could not copy link to clipboard.",
        });
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }, []);

    const pageTitle = getPageName(page?.name);

    const handleSave = useCallback(async () => {
      let originalState: TPageShareFormUser[] = [];

      let toastId: string | undefined;
      try {
        if (!shareForm?.formState?.isDirty || !page?.id) {
          return;
        }

        toastId = setToast({
          type: TOAST_TYPE.LOADING,
          title: "Saving...",
        }) as string;

        // Optimistically move pending users to existing users and get rollback state
        originalState = shareForm?.actions?.optimisticSave?.() || [];

        const finalSharedUsers = (shareForm.data?.sharedUsers || [])
          .filter((user) => !user.isOwner)
          .map((user) => ({
            user_id: user.user_id,
            access: user.access,
          }));

        await bulkUpdatePageSharedUsers(page.id, finalSharedUsers);

        dismissToast(toastId);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Page sharing updated successfully.",
        });

        shareForm?.actions?.reset();
        onClose();
      } catch (error) {
        // Rollback optimistic changes on error
        if (shareForm?.actions?.rollback && originalState.length > 0) {
          shareForm.actions.rollback(originalState);
        }

        if (toastId) dismissToast(toastId);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error updating sharing",
          message: "Failed to update page sharing. Please try again.",
        });
      }
    }, [shareForm, bulkUpdatePageSharedUsers, page?.id, onClose]);

    const handleCancel = useCallback(() => {
      shareForm?.actions?.reset();
      onClose();
    }, [shareForm?.actions, onClose]);

    const modalData = useMemo(() => {
      const pageOwner = page?.owned_by ? getWorkspaceMemberDetails(page.owned_by) : null;
      const ownerUser =
        pageOwner?.member && page.owned_by
          ? {
              id: `owner-${page.owned_by}`,
              user_id: page.owned_by,
              access: 2,
              isNew: false,
              isOwner: true,
            }
          : null;

      const sharedUsers = shareForm?.data?.sharedUsers || [];
      const allDisplayUsers = ownerUser
        ? [ownerUser, ...sharedUsers.filter((user) => !user.isNew)]
        : sharedUsers.filter((user) => !user.isNew);

      // Filter out page owner and guest users from member options
      const filteredMemberOptions = (memberOptions || []).filter((option) => {
        if (option.value === page?.owned_by) return false;

        const memberDetails = getWorkspaceMemberDetails(option.value);
        if (memberDetails?.role === EUserWorkspaceRoles.GUEST) return false;

        return true;
      });

      return {
        pageTitle,
        copied,
        sharedUsers,
        pendingSharedUsers: (shareForm?.actions?.getNewUsers() || []).map((user) => ({
          user_id: user.user_id,
          access: user.access,
        })),
        modifiedSharedUsers: (shareForm?.actions?.getModifiedUsers() || []).map((user) => ({
          user_id: user.user_id,
          originalAccess: user.originalAccess!,
          newAccess: user.access,
        })),
        existingUsers: allDisplayUsers,
        memberOptions: filteredMemberOptions,
        totalSharedUsers: sharedUsers.length + (ownerUser ? 1 : 0),
        hasUnsavedChanges: shareForm?.formState?.isDirty || false,
        isSubmitting: shareForm?.formState?.isSubmitting || false,
        isLoadingSharedUsers,
        isSharedUsersAccordionOpen,
        canCurrentUserChangeAccess: page?.canCurrentUserChangeAccess || false,
      };
    }, [
      pageTitle,
      copied,
      shareForm,
      memberOptions,
      isLoadingSharedUsers,
      page?.owned_by,
      page?.canCurrentUserChangeAccess,
      getWorkspaceMemberDetails,
      isSharedUsersAccordionOpen,
    ]);

    const modalActions = useMemo(
      () => ({
        copyLink: handleCopyLink,
        selectMember: (memberId: string) => {
          const memberDetails = getWorkspaceMemberDetails(memberId);
          if (!memberDetails?.member?.id) {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error adding shared user",
              message: "Could not find member details. Please try again.",
            });
            return;
          }

          shareForm?.actions?.addUser({
            user_id: memberDetails.member.id,
          });
        },
        toggleSharedUsersAccordion: onToggleSharedUsersAccordion,
        updateExistingAccess: (userId: string, access: EPageSharedUserAccess) => {
          if (userId === page?.owned_by) return;

          shareForm?.actions?.updateUserAccess(userId, access);
        },
        removeExisting: (userId: string) => {
          if (userId === page?.owned_by) return;

          shareForm?.actions?.removeUser(userId);
        },
        updatePendingAccess: (userId: string, access: EPageSharedUserAccess) => {
          shareForm?.actions?.updateUserAccess(userId, access);
        },
        removePending: (userId: string) => {
          shareForm?.actions?.removeUser(userId);
        },
        getMemberDetails: getWorkspaceMemberDetails,
        isUserModified: (userId: string) => {
          if (userId === page?.owned_by) return false;

          const modifiedUsers = shareForm?.actions?.getModifiedUsers() || [];
          return modifiedUsers.some((user) => user.user_id === userId);
        },
        save: handleSave,
        cancel: handleCancel,
      }),
      [
        handleCopyLink,
        getWorkspaceMemberDetails,
        shareForm,
        handleSave,
        handleCancel,
        page?.owned_by,
        onToggleSharedUsersAccordion,
      ]
    );

    return <SharePageModal isOpen={isOpen} onClose={onClose} data={modalData} onAction={modalActions} />;
  }
);
