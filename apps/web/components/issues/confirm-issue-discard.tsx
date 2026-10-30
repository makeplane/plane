/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useState } from "react";
// ui
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogHeading,
  DialogInfo,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  onDiscard: () => void;
  onConfirm: () => Promise<void>;
};

export function ConfirmIssueDiscard(props: Props) {
  const { t } = useTranslation();

  const { isOpen, handleClose, onDiscard, onConfirm } = props;

  const [isLoading, setIsLoading] = useState(false);

  const onClose = () => {
    handleClose();
    setIsLoading(false);
  };

  const handleDeletion = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="md">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>{t("web_ui.save_this_draft")}</DialogTitle>
              <DialogDescription>
                {t("web_ui.you_can_save_this_work_item_to_drafts_so_you_can_come_back_to_it_later")}{" "}
              </DialogDescription>
            </DialogHeading>
          </DialogHeader>
        </DialogMain>
        <DialogActions>
          <DialogInfo>
            <Button variant="secondary" size="sm" stretch="auto" onClick={onDiscard} label={t("discard")} />
          </DialogInfo>
          <Button variant="secondary" size="sm" stretch="auto" onClick={onClose} label={t("cancel")} />
          <Button
            variant="primary"
            size="sm"
            stretch="auto"
            onClick={() => void handleDeletion()}
            loading={isLoading}
            label={isLoading ? t("saving") : t("save_to_drafts")}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
