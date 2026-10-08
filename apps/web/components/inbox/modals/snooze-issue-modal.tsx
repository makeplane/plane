/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// ui
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Calendar } from "@makeplane/propel/components/calendar";
import { Dialog, DialogActions, DialogBody, DialogContent, DialogMain } from "@makeplane/propel/components/dialog";

export type InboxIssueSnoozeModalProps = {
  isOpen: boolean;
  value: Date | undefined;
  onConfirm: (value: Date) => void;
  handleClose: () => void;
};

export function InboxIssueSnoozeModal(props: InboxIssueSnoozeModalProps) {
  const { isOpen, handleClose, value, onConfirm } = props;
  // states
  const [date, setDate] = useState(value || new Date());
  //hooks
  const { t } = useTranslation();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="xs" aria-label={t("inbox_issue.actions.snooze")}>
        <DialogMain>
          <DialogBody>
            <Calendar
              selected={date ? new Date(date) : undefined}
              defaultMonth={date ? new Date(date) : undefined}
              onSelect={(date: Date | undefined) => {
                if (!date) return;
                setDate(date);
              }}
              mode="single"
              showOutsideDays
              disabled={[
                {
                  before: new Date(),
                },
              ]}
            />
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <Button
            variant="primary"
            size="sm"
            stretch="auto"
            onClick={() => {
              handleClose();
              onConfirm(date);
            }}
            label={t("inbox_issue.actions.snooze")}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
