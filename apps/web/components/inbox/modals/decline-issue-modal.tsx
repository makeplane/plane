/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
// types
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
// ui
import { ConfirmDialog } from "@plane/blocks/dialog";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  data: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
};

export function DeclineIssueModal(props: Props) {
  const { isOpen, onClose, data, onSubmit } = props;
  // states
  const [isDeclining, setIsDeclining] = useState(false);
  // store hooks
  const { getProjectById } = useProject();
  const { t } = useTranslation();
  // derived values
  const projectDetails = data.project_id ? getProjectById(data?.project_id) : undefined;

  const handleClose = () => {
    setIsDeclining(false);
    onClose();
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      await onSubmit();
    } catch (error) {
      console.error("Failed to decline the intake work item", error);
    } finally {
      setIsDeclining(false);
    }
  };

  return (
    <ConfirmDialog
      handleClose={handleClose}
      handleSubmit={handleDecline}
      isSubmitting={isDeclining}
      isOpen={isOpen}
      title={t("inbox_issue.modals.decline.title")}
      // TODO: Need to translate the confirmation message
      content={
        <>
          {t("web_ui.are_you_sure_you_want_to_decline_work_item")}{" "}
          <span className="font-medium break-words text-primary">
            {projectDetails?.identifier}-{data?.sequence_id}
          </span>
          {""}
          {t("sso.domain_management.verified_domains.delete_domain.description.suffix")}{" "}
        </>
      }
      primaryButtonText={{
        loading: t("declining"),
        default: t("decline"),
      }}
    />
  );
}
