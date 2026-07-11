/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// i18n
import { useTranslation } from "@plane/i18n";
// ui
import { AlertModalCore } from "@plane/ui";

type Props = {
  isOpen: boolean;
  isDeleting: boolean;
  handleClose: () => void;
  handleSubmit: () => void;
};

/**
 * @description confirmation modal shown before permanently deleting the selected work items in bulk.
 * Reuses the shared `AlertModalCore` danger pattern used across the codebase.
 */
export function BulkDeleteConfirmationModal(props: Props) {
  const { isOpen, isDeleting, handleClose, handleSubmit } = props;
  // i18n
  const { t } = useTranslation();

  return (
    <AlertModalCore
      isOpen={isOpen}
      handleClose={handleClose}
      handleSubmit={handleSubmit}
      isSubmitting={isDeleting}
      title={t("bulk_operations.delete_confirmation.title")}
      content={t("bulk_operations.delete_confirmation.description")}
    />
  );
}
