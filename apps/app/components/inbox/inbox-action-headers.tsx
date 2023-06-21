import { useEffect, useState } from "react";

import { useRouter } from "next/router";

// react-datepicker
import DatePicker from "react-datepicker";
// headless ui
import { Popover } from "@headlessui/react";
// contexts
import { useProjectMyMembership } from "contexts/project-member.context";
// hooks
import useInboxView from "hooks/use-inbox-view";
import useUserAuth from "hooks/use-user-auth";
// components
import { FiltersDropdown } from "components/inbox";
// ui
import { PrimaryButton, SecondaryButton } from "components/ui";
// icons
import { InboxIcon, StackedLayersHorizontalIcon } from "components/icons";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
// types
import type { IInboxIssue } from "types";

type Props = {
  issueCount: number;
  currentIssueIndex: number;
  issue?: IInboxIssue;
  onAccept: () => Promise<void>;
  onDecline: () => void;
  onMarkAsDuplicate: () => void;
  onSnooze: (date: Date | string) => void;
  onDelete: () => void;
};

export const InboxActionHeader: React.FC<Props> = (props) => {
  const {
    issueCount,
    currentIssueIndex,
    onAccept,
    onDecline,
    onMarkAsDuplicate,
    onSnooze,
    onDelete,
    issue,
  } = props;

  const [isAccepting, setIsAccepting] = useState(false);
  const [date, setDate] = useState(new Date());

  const router = useRouter();
  const { inboxIssueId } = router.query;

  const { memberRole } = useProjectMyMembership();
  const { filters, setFilters, filtersLength } = useInboxView();
  const { user } = useUserAuth();

  const handleAcceptIssue = () => {
    setIsAccepting(true);

    onAccept().finally(() => setIsAccepting(false));
  };

  useEffect(() => {
    if (!issue?.issue_inbox[0].snoozed_till) return;

    setDate(new Date(issue.issue_inbox[0].snoozed_till));
  }, [issue]);

  const issueStatus = issue?.issue_inbox[0].status;
  const isAllowed = memberRole.isMember || memberRole.isOwner;

  const today = new Date();
  const tomorrow = new Date(today);

  tomorrow.setDate(today.getDate() + 1);

  return (
    <div className="grid grid-cols-4 border-b border-brand-base divide-x divide-brand-base">
      <div className="col-span-1 flex justify-between p-4">
        <div className="flex items-center gap-2">
          <InboxIcon className="h-4 w-4 text-brand-secondary" />
          <h3 className="font-medium">Inbox</h3>
        </div>
        <div className="relative">
          <FiltersDropdown
            filters={filters}
            onSelect={(option) => {
              const key = option.key as keyof typeof filters;

              const valueExists = (filters[key] as any[])?.includes(option.value);

              if (valueExists) {
                setFilters({
                  [option.key]: ((filters[key] ?? []) as any[])?.filter(
                    (val) => val !== option.value
                  ),
                });
              } else {
                setFilters({
                  [option.key]: [...((filters[key] ?? []) as any[]), option.value],
                });
              }
            }}
            direction="right"
            height="rg"
          />
          {filtersLength > 0 && (
            <div className="absolute -top-2 -right-2 h-4 w-4 text-[0.65rem] grid place-items-center rounded-full text-brand-base bg-brand-surface-2 border border-brand-base z-10">
              <span>{filtersLength}</span>
            </div>
          )}
        </div>
      </div>
      {inboxIssueId && (
        <div className="flex justify-between items-center gap-4 px-4 col-span-3">
          <div className="flex items-center gap-x-2">
            <button
              type="button"
              className="rounded border border-brand-base bg-brand-surface-1 p-1.5 hover:bg-brand-surface-2"
              onClick={() => {
                const e = new KeyboardEvent("keydown", { key: "ArrowUp" });
                document.dispatchEvent(e);
              }}
            >
              <ChevronUpIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="rounded border border-brand-base bg-brand-surface-1 p-1.5 hover:bg-brand-surface-2"
              onClick={() => {
                const e = new KeyboardEvent("keydown", { key: "ArrowDown" });
                document.dispatchEvent(e);
              }}
            >
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </button>
            <div className="text-sm">
              {currentIssueIndex + 1}/{issueCount}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {isAllowed && (
              <div
                className={`flex-shrink-0 ${
                  issueStatus === 0 || issueStatus === -2 ? "" : "opacity-70"
                }`}
              >
                <Popover className="relative">
                  <Popover.Button
                    as="button"
                    type="button"
                    disabled={!(issueStatus === 0 || issueStatus === -2)}
                  >
                    <SecondaryButton
                      className={`flex gap-x-1 items-center ${
                        issueStatus === 0 || issueStatus === -2 ? "" : "cursor-not-allowed"
                      }`}
                      size="sm"
                    >
                      <ClockIcon className="h-4 w-4 text-brand-secondary" />
                      <span>Snooze</span>
                    </SecondaryButton>
                  </Popover.Button>
                  <Popover.Panel className="w-80 p-2 absolute right-0 z-10 mt-2 rounded-md border border-brand-base bg-brand-surface-2 shadow-lg">
                    {({ close }) => (
                      <div className="w-full h-full flex flex-col gap-y-1">
                        <DatePicker
                          selected={date ? new Date(date) : null}
                          onChange={(val) => {
                            if (!val) return;
                            setDate(val);
                          }}
                          dateFormat="dd-MM-yyyy"
                          minDate={tomorrow}
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
              </div>
            )}
            {isAllowed && (
              <div className={`flex gap-3 flex-wrap ${issueStatus !== -2 ? "opacity-70" : ""}`}>
                <SecondaryButton
                  size="sm"
                  className="flex gap-2 items-center"
                  onClick={onMarkAsDuplicate}
                  disabled={issueStatus !== -2}
                >
                  <StackedLayersHorizontalIcon className="h-4 w-4 text-brand-secondary" />
                  <span>Mark as duplicate</span>
                </SecondaryButton>
                <SecondaryButton
                  size="sm"
                  className="flex gap-2 items-center"
                  onClick={handleAcceptIssue}
                  disabled={issueStatus !== -2}
                  loading={isAccepting}
                >
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>{isAccepting ? "Accepting..." : "Accept"}</span>
                </SecondaryButton>
                <SecondaryButton
                  size="sm"
                  className="flex gap-2 items-center"
                  onClick={onDecline}
                  disabled={issueStatus !== -2}
                >
                  <XCircleIcon className="h-4 w-4 text-red-500" />
                  <span>Decline</span>
                </SecondaryButton>
              </div>
            )}
            {(isAllowed || user?.id === issue?.created_by) && (
              <div className="flex-shrink-0">
                <SecondaryButton size="sm" className="flex gap-2 items-center" onClick={onDelete}>
                  <TrashIcon className="h-4 w-4 text-red-500" />
                  <span>Delete</span>
                </SecondaryButton>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
