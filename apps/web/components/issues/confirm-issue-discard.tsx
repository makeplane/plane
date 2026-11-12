/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
              <DialogTitle>Save this draft?</DialogTitle>
              <DialogDescription>
                You can save this work item to Drafts so you can come back to it later.
              </DialogDescription>
            </DialogHeading>
          </DialogHeader>
        </DialogMain>
        <DialogActions>
          <DialogInfo>
            <Button variant="secondary" size="sm" stretch="auto" onClick={onDiscard} label="Discard" />
          </DialogInfo>
          <Button variant="secondary" size="sm" stretch="auto" onClick={onClose} label="Cancel" />
          <Button
            variant="primary"
            size="sm"
            stretch="auto"
            onClick={() => void handleDeletion()}
            loading={isLoading}
            label={isLoading ? "Saving" : "Save to Drafts"}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
