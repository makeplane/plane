/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useMemo } from "react";
// Plane
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// PLane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiativeLink } from "@/types/initiative";

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

  const { t } = useTranslation();

  const handleLinkOperations: TLinkOperations = useMemo(
    () => ({
      create: async (data: Partial<TInitiativeLink>) => {
        try {
          if (!workspaceSlug || !initiativeId) throw new Error("Missing required fields");
          await createInitiativeLink(workspaceSlug, initiativeId, data);
          setToast({
            message: t("links.toasts.created.message"),
            type: TOAST_TYPE.SUCCESS,
            title: t("links.toasts.created.title"),
          });
          setIsLinkModalOpen(false);
        } catch (error: any) {
          setToast({
            message: error?.data?.error ?? t("links.toasts.not_created.message"),
            type: TOAST_TYPE.ERROR,
            title: t("links.toasts.not_created.title"),
          });
          throw error;
        }
      },
      update: async (linkId: string, data: Partial<TInitiativeLink>) => {
        try {
          if (!workspaceSlug || !initiativeId) throw new Error("Missing required fields");
          await updateInitiativeLink(workspaceSlug, initiativeId, linkId, data);
          setToast({
            message: t("links.toasts.updated.message"),
            type: TOAST_TYPE.SUCCESS,
            title: t("links.toasts.updated.title"),
          });
          setIsLinkModalOpen(false);
        } catch (error) {
          setToast({
            message: t("links.toasts.not_updated.message"),
            type: TOAST_TYPE.ERROR,
            title: t("links.toasts.not_updated.title"),
          });
          throw error;
        }
      },
      remove: async (linkId: string) => {
        try {
          if (!workspaceSlug || !initiativeId) throw new Error("Missing required fields");
          await deleteInitiativeLink(workspaceSlug, initiativeId, linkId);
          setToast({
            message: t("links.toasts.removed.message"),
            type: TOAST_TYPE.SUCCESS,
            title: t("links.toasts.removed.title"),
          });
          setIsLinkModalOpen(false);
        } catch (error) {
          setToast({
            message: t("links.toasts.not_removed.message"),
            type: TOAST_TYPE.ERROR,
            title: t("links.toasts.not_removed.title"),
          });
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaceSlug, initiativeId, createInitiativeLink, updateInitiativeLink, deleteInitiativeLink, setIsLinkModalOpen]
  );

  return handleLinkOperations;
};
