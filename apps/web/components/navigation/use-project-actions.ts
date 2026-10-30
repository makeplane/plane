/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useCallback, useState } from "react";
import { setToast } from "@plane/blocks/toast";
import { copyUrlToClipboard } from "@plane/utils";
import type { TNavigationItem } from "@/components/navigation/tab-navigation-root";

type UseProjectActionsProps = {
  workspaceSlug: string;
  projectId: string;
  activeItem?: TNavigationItem;
};

export const useProjectActions = ({ workspaceSlug, projectId, activeItem }: UseProjectActionsProps) => {
  const { t } = useTranslation();

  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [leaveProjectModalOpen, setLeaveProjectModalOpen] = useState(false);

  const handleLeaveProject = useCallback(() => {
    setLeaveProjectModalOpen(true);
  }, []);

  const handleCopyText = useCallback(async () => {
    const pathToCopy = activeItem?.href ?? `/${workspaceSlug}/projects/${projectId}/issues`;

    try {
      await copyUrlToClipboard(pathToCopy);
      setToast({
        type: "info",
        title: t("link_copied"),
        message: t("project_link_copied_to_clipboard"),
      });
    } catch (_error) {
      setToast({
        type: "error",
        title: t("web_ui.copy_failed"),
        message: t("web_ui.we_couldn_t_copy_the_link_please_try_again"),
      });
    }
  }, [t, activeItem, projectId, workspaceSlug]);

  const handlePublishModal = useCallback((open: boolean) => {
    setPublishModalOpen(open);
  }, []);

  const handleLeaveProjectModal = useCallback((open: boolean) => {
    setLeaveProjectModalOpen(open);
  }, []);

  return {
    publishModalOpen,
    leaveProjectModalOpen,
    handleLeaveProject,
    handleCopyText,
    handlePublishModal,
    handleLeaveProjectModal,
  };
};
