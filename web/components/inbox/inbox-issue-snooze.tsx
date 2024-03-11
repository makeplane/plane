import { FC, useState } from "react";
import { Popover } from "@headlessui/react";
import { DayPicker } from "react-day-picker";
// icons
import { Clock } from "lucide-react";
// ui
import { Button } from "@plane/ui";

export type InboxIssueSnoozeProps = {
  value: Date | undefined;
  onConfirm: (value: Date) => void;
};

export const InboxIssueSnooze: FC<InboxIssueSnoozeProps> = (props) => {
  const { value, onConfirm } = props;
  // states
  const [date, setDate] = useState(value || new Date());

  return (
    <div className="flex-shrink-0">
      <Popover className="relative">
        <Popover.Button as="button" type="button">
          <Button variant="neutral-primary" prependIcon={<Clock size={14} strokeWidth={2} />} size="sm">
            Snooze
          </Button>
        </Popover.Button>
        <Popover.Panel className="absolute right-0 z-10 mt-2 w-80 rounded-md bg-custom-background-100 p-2 shadow-lg">
          {({ close }) => (
            <div className="flex h-full w-full flex-col gap-y-1">
              <DayPicker
                selected={date ? new Date(date) : undefined}
                defaultMonth={date ? new Date(date) : undefined}
                onSelect={(date) => {
                  if (!date) return;
                  setDate(date);
                }}
                mode="single"
                className="rounded-md border border-custom-border-200 p-3"
                // disabled={[
                //   {
                //     before: tomorrow,
                //   },
                // ]}
              />
              <Button
                variant="primary"
                onClick={() => {
                  close();
                  onConfirm(date);
                }}
              >
                Snooze
              </Button>
            </div>
          )}
        </Popover.Panel>
      </Popover>
    </div>
  );
};
