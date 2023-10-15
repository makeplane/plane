import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
import DatePicker from "react-datepicker";
import { Popover } from "@headlessui/react";
// contexts
import { useProjectMyMembership } from "contexts/project-member.context";
// services
import { InboxService } from "services/inbox.service";
// hooks
import useInboxView from "hooks/use-inbox-view";
import useUserAuth from "hooks/use-user-auth";
import useToast from "hooks/use-toast";
// components
import {
  AcceptIssueModal,
  DeclineIssueModal,
  DeleteIssueModal,
  FiltersDropdown,
  SelectDuplicateInboxIssueModal,
} from "components/inbox";
// ui
import { Button } from "@plane/ui";
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
import type { IInboxIssueDetail, TInboxStatus } from "types";
// fetch-keys
import { INBOX_ISSUE_DETAILS } from "constants/fetch-keys";

const inboxService = new InboxService();

export const InboxActionHeader = () => {
  const [date, setDate] = useState(new Date());
  const [selectDuplicateIssue, setSelectDuplicateIssue] = useState(false);
  const [acceptIssueModal, setAcceptIssueModal] = useState(false);
  const [declineIssueModal, setDeclineIssueModal] = useState(false);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, inboxId, inboxIssueId } = router.query;

  const { user } = useUserAuth();
  const { memberRole } = useProjectMyMembership();
  const { issues: inboxIssues, mutate: mutateInboxIssues } = useInboxView();
  const { setToastAlert } = useToast();

  const markInboxStatus = async (data: TInboxStatus) => {
    if (!workspaceSlug || !projectId || !inboxId || !inboxIssueId) return;

    mutate<IInboxIssueDetail>(
      INBOX_ISSUE_DETAILS(inboxId as string, inboxIssueId as string),
      (prevData) => {
        if (!prevData) return prevData;

        return {
          ...prevData,
          issue_inbox: [{ ...prevData.issue_inbox[0], ...data }],
        };
      },
      false
    );
    mutateInboxIssues(
      (prevData: any) =>
        (prevData ?? []).map((i: any) =>
          i.bridge_id === inboxIssueId ? { ...i, issue_inbox: [{ ...i.issue_inbox[0], ...data }] } : i
        ),
      false
    );

    await inboxService
      .markInboxStatus(
        workspaceSlug.toString(),
        projectId.toString(),
        inboxId.toString(),
        inboxIssues?.find((inboxIssue: any) => inboxIssue.bridge_id === inboxIssueId)?.bridge_id!,
        data,
        user
      )
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Something went wrong while updating inbox status. Please try again.",
        })
      )
      .finally(() => {
        mutate(INBOX_ISSUE_DETAILS(inboxId as string, inboxIssueId as string));
        mutateInboxIssues();
      });
  };

  const issue = inboxIssues?.find((issue: any) => issue.bridge_id === inboxIssueId);
  const currentIssueIndex = inboxIssues?.findIndex((issue: any) => issue.bridge_id === inboxIssueId) ?? 0;

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
    <>
      <SelectDuplicateInboxIssueModal
        isOpen={selectDuplicateIssue}
        onClose={() => setSelectDuplicateIssue(false)}
        value={
          inboxIssues?.find((inboxIssue: any) => inboxIssue.bridge_id === inboxIssueId)?.issue_inbox[0].duplicate_to
        }
        onSubmit={(dupIssueId: string) => {
          markInboxStatus({
            status: 2,
            duplicate_to: dupIssueId,
          }).finally(() => setSelectDuplicateIssue(false));
        }}
      />
      <AcceptIssueModal
        isOpen={acceptIssueModal}
        handleClose={() => setAcceptIssueModal(false)}
        data={inboxIssues?.find((i: any) => i.bridge_id === inboxIssueId)}
        onSubmit={async () => {
          await markInboxStatus({
            status: 1,
          }).finally(() => setAcceptIssueModal(false));
        }}
      />
      <DeclineIssueModal
        isOpen={declineIssueModal}
        handleClose={() => setDeclineIssueModal(false)}
        data={inboxIssues?.find((i: any) => i.bridge_id === inboxIssueId)}
        onSubmit={async () => {
          await markInboxStatus({
            status: -1,
          }).finally(() => setDeclineIssueModal(false));
        }}
      />
      <DeleteIssueModal
        isOpen={deleteIssueModal}
        handleClose={() => setDeleteIssueModal(false)}
        data={inboxIssues?.find((i: any) => i.bridge_id === inboxIssueId)}
      />
      <div className="grid grid-cols-4 border-b border-custom-border-200 divide-x divide-custom-border-200">
        <div className="col-span-1 flex justify-between p-4">
          <div className="flex items-center gap-2">
            <InboxIcon className="h-4 w-4 text-custom-text-200" />
            <h3 className="font-medium">Inbox</h3>
          </div>
          <FiltersDropdown />
        </div>
        {inboxIssueId && (
          <div className="flex justify-between items-center gap-4 px-4 col-span-3">
            <div className="flex items-center gap-x-2">
              <button
                type="button"
                className="rounded border border-custom-border-200 bg-custom-background-90 p-1.5 hover:bg-custom-background-80"
                onClick={() => {
                  const e = new KeyboardEvent("keydown", { key: "ArrowUp" });
                  document.dispatchEvent(e);
                }}
              >
                <ChevronUpIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="rounded border border-custom-border-200 bg-custom-background-90 p-1.5 hover:bg-custom-background-80"
                onClick={() => {
                  const e = new KeyboardEvent("keydown", { key: "ArrowDown" });
                  document.dispatchEvent(e);
                }}
              >
                <ChevronDownIcon className="h-3.5 w-3.5" />
              </button>
              <div className="text-sm">
                {currentIssueIndex + 1}/{inboxIssues?.length ?? 0}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {isAllowed && (issueStatus === 0 || issueStatus === -2) && (
                <div className="flex-shrink-0">
                  <Popover className="relative">
                    <Popover.Button as="button" type="button">
                      <Button
                        variant="neutral-primary"
                        prependIcon={<ClockIcon className="text-custom-text-200" />}
                        size="sm"
                      >
                        Snooze
                      </Button>
                    </Popover.Button>
                    <Popover.Panel className="w-80 p-2 absolute right-0 z-10 mt-2 rounded-md border border-custom-border-200 bg-custom-background-80 shadow-lg">
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
                          <Button
                            variant="primary"
                            onClick={() => {
                              close();
                              markInboxStatus({
                                status: 0,
                                snoozed_till: new Date(date),
                              });
                            }}
                          >
                            Snooze
                          </Button>
                        </div>
                      )}
                    </Popover.Panel>
                  </Popover>
                </div>
              )}
              {isAllowed && issueStatus === -2 && (
                <div className="flex-shrink-0">
                  <Button
                    variant="neutral-primary"
                    size="sm"
                    prependIcon={<StackedLayersHorizontalIcon className="text-custom-text-200" />}
                    onClick={() => setSelectDuplicateIssue(true)}
                  >
                    Mark as duplicate
                  </Button>
                </div>
              )}
              {isAllowed && (issueStatus === 0 || issueStatus === -2) && (
                <div className="flex-shrink-0">
                  <Button
                    variant="neutral-primary"
                    size="sm"
                    prependIcon={<CheckCircleIcon className="text-green-500" />}
                    onClick={() => setAcceptIssueModal(true)}
                  >
                    Accept
                  </Button>
                </div>
              )}
              {isAllowed && issueStatus === -2 && (
                <div className="flex-shrink-0">
                  <Button
                    variant="neutral-primary"
                    size="sm"
                    prependIcon={<XCircleIcon className="text-red-500" />}
                    onClick={() => setDeclineIssueModal(true)}
                  >
                    Decline
                  </Button>
                </div>
              )}
              {(isAllowed || user?.id === issue?.created_by) && (
                <div className="flex-shrink-0">
                  <Button
                    variant="neutral-primary"
                    size="sm"
                    prependIcon={<TrashIcon className="text-red-500" />}
                    onClick={() => setDeleteIssueModal(true)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
