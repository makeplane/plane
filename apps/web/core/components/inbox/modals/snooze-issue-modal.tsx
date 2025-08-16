"use client";

import { FC, useState } from "react";
// ui
import { useTranslation } from "@plane/i18n";
import { Button, Calendar, Dialog, EModalWidth } from "@plane/ui";

export type InboxIssueSnoozeModalProps = {
  isOpen: boolean;
  value: Date | undefined;
  onConfirm: (value: Date) => void;
  handleClose: () => void;
};

export const InboxIssueSnoozeModal: FC<InboxIssueSnoozeModalProps> = (props) => {
  const { isOpen, handleClose, value, onConfirm } = props;
  // states
  const [date, setDate] = useState(value || new Date());
  //hooks
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <Dialog.Panel width={EModalWidth.XXL}>
        <div className="flex h-full w-full flex-col gap-y-1">
          <Calendar
            captionLayout="dropdown"
            classNames={{ root: `rounded-md border border-custom-border-200 p-3` }}
            selected={date ? new Date(date) : undefined}
            defaultMonth={date ? new Date(date) : undefined}
            onSelect={(date) => {
              if (!date) return;
              setDate(date);
            }}
            mode="single"
            disabled={[
              {
                before: new Date(),
              },
            ]}
          />
          <Button
            variant="primary"
            onClick={() => {
              close();
              onConfirm(date);
            }}
          >
            {t("inbox_issue.actions.snooze")}
          </Button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};
