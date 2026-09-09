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
import { EModalPosition, EModalWidth, ModalCore } from "@plane/blocks/modals";

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
    <ModalCore
      isOpen={isOpen}
      handleClose={handleClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.SM}
      className="w-auto"
    >
      <div className="flex h-full w-full flex-col gap-y-1 px-5 py-8 sm:p-6">
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
      </div>
    </ModalCore>
  );
}
