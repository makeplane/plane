import { useEffect, useState } from "react";

// icons
import { InboxIcon, StackedLayersHorizontalIcon } from "components/icons";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

// headless ui
import { Popover } from "@headlessui/react";

// react-datepicker
import DatePicker from "react-datepicker";

// components
import { PrimaryButton, SecondaryButton, MultiLevelDropdown } from "components/ui";

// types
import type { IInboxIssue } from "types";

type Props = {
  issueCount: number;
  currentIssueIndex: number;
  filter: any;
  setFilter: (value: any) => void;
  inboxIssue?: IInboxIssue;
  onAccept: () => void;
  onDecline: () => void;
  onMarkAsDuplicate: () => void;
  onSnooze: (date: Date | string) => void;
};

export const InboxActionHeader: React.FC<Props> = (props) => {
  const {
    issueCount,
    currentIssueIndex,
    onAccept,
    onDecline,
    onMarkAsDuplicate,
    onSnooze,
    filter,
    setFilter,
    inboxIssue,
  } = props;

  const [date, setDate] = useState(new Date());

  useEffect(() => {
    if (!inboxIssue?.snoozed_till) return;
    setDate(new Date(inboxIssue.snoozed_till));
  }, [inboxIssue]);

  return (
    <div className="grid grid-cols-4 border-b border-brand-base divide-x">
      <div className="col-span-1 flex justify-between p-4">
        <div className="flex items-center gap-2">
          <InboxIcon className="h-5 w-5 text-brand-secondary" />
          <h3 className="font-semibold">Inbox</h3>
        </div>
        <div>
          <MultiLevelDropdown
            label="Filters"
            onSelect={(value) => {
              setFilter(value);
            }}
            direction="left"
            options={[
              {
                id: "all",
                label: "All",
                value: "all",
                selected: filter === "all",
              },
              {
                id: "snooze",
                label: "Snooze",
                value: "snooze",
                selected: filter === "snooze",
              },
              {
                id: "mark_as_duplicate",
                label: "Duplicate",
                value: "duplicate",
                selected: filter === "duplicate",
              },
              {
                id: "accepted",
                label: "Accepted",
                value: "accepted",
                selected: filter === "accepted",
              },
              {
                id: "declined",
                label: "Declined",
                value: "declined",
                selected: filter === "declined",
              },
            ]}
          />
        </div>
      </div>

      <div className="flex justify-between items-center px-8 col-span-3">
        <div className="flex gap-x-3">
          <button
            type="button"
            className="rounded border bg-brand-surface-1 p-1.5 hover:bg-brand-surface-2"
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "ArrowUp" });
              document.dispatchEvent(e);
            }}
          >
            <ChevronUpIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded border bg-brand-surface-1 p-1.5 hover:bg-brand-surface-2"
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "ArrowDown" });
              document.dispatchEvent(e);
            }}
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
          <div>
            {currentIssueIndex + 1}/{issueCount}
          </div>
        </div>
        <div className="flex gap-x-3">
          <Popover>
            <Popover.Button as="div">
              <SecondaryButton className="flex gap-x-1 items-center" size="sm">
                <ClockIcon className="h-4 w-4 text-brand-secondary" />
                <span>Snooze</span>
              </SecondaryButton>
            </Popover.Button>
            <Popover.Panel className="w-80 p-5 px-2 absolute right-0 z-10 mt-2 mr-3 rounded-md border border-brand-base bg-brand-surface-2 shadow-lg">
              {({ close }) => (
                <div className="w-full h-full flex flex-col gap-y-1">
                  <DatePicker
                    selected={date ? new Date(date) : null}
                    onChange={(val) => {
                      if (!val) return;
                      setDate(val);
                    }}
                    dateFormat="dd-MM-yyyy"
                    inline
                  />
                  <PrimaryButton
                    className="ml-auto"
                    onClick={() => {
                      close();
                      onSnooze(date);
                    }}
                  >
                    Snooze
                  </PrimaryButton>
                </div>
              )}
            </Popover.Panel>
          </Popover>
          <SecondaryButton
            size="sm"
            className="flex gap-x-1 items-center"
            onClick={onMarkAsDuplicate}
          >
            <StackedLayersHorizontalIcon className="h-4 w-4 text-brand-secondary" />
            <span>Mark as duplicate</span>
          </SecondaryButton>
          <SecondaryButton size="sm" className="flex gap-x-1 items-center" onClick={onAccept}>
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span>Accept</span>
          </SecondaryButton>
          <SecondaryButton size="sm" className="flex gap-x-1 items-center" onClick={onDecline}>
            <XCircleIcon className="h-4 w-4 text-red-500" />
            <span>Decline</span>
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
};
