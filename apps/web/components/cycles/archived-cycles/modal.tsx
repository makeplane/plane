/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useState } from "react";
// ui
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
  handleClose: () => void;
  isOpen: boolean;
  onSubmit?: () => Promise<void>;
};

export function ArchiveCycleModal(props: Props) {
  const { t } = useTranslation();

  const { workspaceSlug, projectId, cycleId, isOpen, handleClose } = props;
  // router
  const router = useAppRouter();
  // states
  const [isArchiving, setIsArchiving] = useState(false);
  // store hooks
  const { getCycleNameById, archiveCycle } = useCycle();

  const cycleName = getCycleNameById(cycleId);

  const onClose = () => {
    setIsArchiving(false);
    handleClose();
  };

  const handleArchiveCycle = async () => {
    setIsArchiving(true);
    await archiveCycle(workspaceSlug, projectId, cycleId)
      .then(() => {
        setToast({
          type: "success",
          title: t("issue.archive.success.label"),
          message: t("issue.archive.success.message"),
        });
        onClose();
        router.push(`/${workspaceSlug}/projects/${projectId}/cycles`);
        return;
      })
      .catch(() => {
        setToast({
          type: "error",
          title: t("error"),
          message: t("web_ui.cycle_could_not_be_archived_please_try_again"),
        });
      })
      .finally(() => setIsArchiving(false));
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      handleClose={onClose}
      handleSubmit={handleArchiveCycle}
      isSubmitting={isArchiving}
      variant="primary"
      title={t("web_ui.dynamic_archive_cycle_value0", { value0: cycleName ?? "" })}
      content={t("web_ui.are_you_sure_you_want_to_archive_the_cycle_all_your_archives_can_be_restored_later")}
      primaryButtonText={{ loading: t("common.archiving"), default: t("archive") }}
      secondaryButtonText={t("cancel")}
    />
  );
}
