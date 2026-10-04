/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { addDays, startOfTomorrow } from "date-fns";
// ui
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Calendar } from "@makeplane/propel/components/calendar";
import { Dialog, DialogActions, DialogBody, DialogContent, DialogMain } from "@makeplane/propel/components/dialog";

export type InboxIssueSnoozeModalProps = {
  isOpen: boolean;
  value: Date | undefined;
  projectTimezone: string | undefined;
  onConfirm: (value: Date) => void;
  handleClose: () => void;
};

// Today's calendar date in `timeZone`, as a local-midnight Date (what the calendar compares against).
const getTodayInTimezone = (timeZone: string) => {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date()).split("-").map(Number);
  return new Date(year, month - 1, day);
};

export function InboxIssueSnoozeModal(props: InboxIssueSnoozeModalProps) {
  const { isOpen, handleClose, value, projectTimezone, onConfirm } = props;
  // states
  const [pickedDate, setPickedDate] = useState<Date | undefined>();
  //hooks
  const { t } = useTranslation();
  // derived values
  // A snooze ends at 00:00 of the picked day in the project timezone, so any day that has already
  // started there would lapse at once. The pick is cleared on close because this modal stays
  // mounted across intake items.
  const tomorrow = projectTimezone ? addDays(getTodayInTimezone(projectTimezone), 1) : startOfTomorrow();
  const date = pickedDate ?? (value && new Date(value) >= tomorrow ? new Date(value) : tomorrow);

  const onClose = () => {
    setPickedDate(undefined);
    handleClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent size="xs" aria-label={t("inbox_issue.actions.snooze")}>
        <DialogMain>
          <DialogBody>
            <Calendar
              selected={date}
              defaultMonth={date}
              onSelect={(selected: Date | undefined) => {
                if (!selected) return;
                setPickedDate(selected);
              }}
              mode="single"
              showOutsideDays
              disabled={[
                {
                  before: tomorrow,
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
              onClose();
              onConfirm(date);
            }}
            label={t("inbox_issue.actions.snooze")}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
