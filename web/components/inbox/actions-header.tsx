import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import DatePicker from "react-datepicker";
import { Popover } from "@headlessui/react";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useToast from "hooks/use-toast";
// components
import {
  AcceptIssueModal,
  DeclineIssueModal,
  DeleteInboxIssueModal,
  FiltersDropdown,
  SelectDuplicateInboxIssueModal,
} from "components/inbox";
// ui
import { Button } from "@plane/ui";
// icons
import { CheckCircle2, ChevronDown, ChevronUp, Clock, FileStack, Inbox, Trash2, XCircle } from "lucide-react";
// types
import type { TInboxStatus } from "types";

export const InboxActionsHeader = observer(() => {
  const [date, setDate] = useState(new Date());
  const [selectDuplicateIssue, setSelectDuplicateIssue] = useState(false);
  const [acceptIssueModal, setAcceptIssueModal] = useState(false);
  const [declineIssueModal, setDeclineIssueModal] = useState(false);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, inboxId, inboxIssueId } = router.query;

  const { inboxIssues: inboxIssuesStore, inboxIssueDetails: inboxIssueDetailsStore, user: userStore } = useMobxStore();

  const user = userStore?.currentUser;
  const userRole = userStore.currentProjectRole;
  const issuesList = inboxId ? inboxIssuesStore.inboxIssues[inboxId.toString()] : null;

  const { setToastAlert } = useToast();

  const markInboxStatus = async (data: TInboxStatus) => {
    if (!workspaceSlug || !projectId || !inboxId || !inboxIssueId || !issuesList) return;

    await inboxIssueDetailsStore
      .updateIssueStatus(
        workspaceSlug.toString(),
        projectId.toString(),
        inboxId.toString(),
        issuesList.find((inboxIssue: any) => inboxIssue.issue_inbox[0].id === inboxIssueId)?.issue_inbox[0].id!,
        data
      )
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Something went wrong while updating inbox status. Please try again.",
        })
      );
  };

  const issue = issuesList?.find((issue) => issue.issue_inbox[0].id === inboxIssueId);
  const currentIssueIndex = issuesList?.findIndex((issue) => issue.issue_inbox[0].id === inboxIssueId) ?? 0;

  useEffect(() => {
    if (!issue?.issue_inbox[0].snoozed_till) return;

    setDate(new Date(issue.issue_inbox[0].snoozed_till));
  }, [issue]);

  const issueStatus = issue?.issue_inbox[0].status;
  const isAllowed = userRole === 15 || userRole === 20;

  const today = new Date();
  const tomorrow = new Date(today);

  tomorrow.setDate(today.getDate() + 1);

  return (
    <>
      {issue && (
        <>
          <SelectDuplicateInboxIssueModal
            isOpen={selectDuplicateIssue}
            onClose={() => setSelectDuplicateIssue(false)}
            value={issue?.issue_inbox[0].duplicate_to}
            onSubmit={(dupIssueId) => {
              markInboxStatus({
                status: 2,
                duplicate_to: dupIssueId,
              }).finally(() => setSelectDuplicateIssue(false));
            }}
          />
          <AcceptIssueModal
            data={issue}
            isOpen={acceptIssueModal}
            onClose={() => setAcceptIssueModal(false)}
            onSubmit={async () => {
              await markInboxStatus({
                status: 1,
              }).finally(() => setAcceptIssueModal(false));
            }}
          />
          <DeclineIssueModal
            data={issue}
            isOpen={declineIssueModal}
            onClose={() => setDeclineIssueModal(false)}
            onSubmit={async () => {
              await markInboxStatus({
                status: -1,
              }).finally(() => setDeclineIssueModal(false));
            }}
          />
          <DeleteInboxIssueModal data={issue} isOpen={deleteIssueModal} onClose={() => setDeleteIssueModal(false)} />
        </>
      )}
      <div className="grid grid-cols-4 border-b border-custom-border-200 divide-x divide-custom-border-200">
        <div className="col-span-1 flex justify-between p-4">
          <div className="flex items-center gap-2">
            <Inbox className="text-custom-text-200" size={16} strokeWidth={2} />
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
                <ChevronUp size={14} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="rounded border border-custom-border-200 bg-custom-background-90 p-1.5 hover:bg-custom-background-80"
                onClick={() => {
                  const e = new KeyboardEvent("keydown", { key: "ArrowDown" });
                  document.dispatchEvent(e);
                }}
              >
                <ChevronDown size={14} strokeWidth={2} />
              </button>
              <div className="text-sm">
                {currentIssueIndex + 1}/{issuesList?.length ?? 0}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {isAllowed && (issueStatus === 0 || issueStatus === -2) && (
                <div className="flex-shrink-0">
                  <Popover className="relative">
                    <Popover.Button as="button" type="button">
                      <Button variant="neutral-primary" prependIcon={<Clock size={14} strokeWidth={2} />} size="sm">
                        Snooze
                      </Button>
                    </Popover.Button>
                    <Popover.Panel className="w-80 p-2 absolute right-0 z-10 mt-2 rounded-md bg-custom-background-100 shadow-lg">
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
                    prependIcon={<FileStack size={14} strokeWidth={2} />}
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
                    prependIcon={<CheckCircle2 className="text-green-500" size={14} strokeWidth={2} />}
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
                    prependIcon={<XCircle className="text-red-500" size={14} strokeWidth={2} />}
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
                    prependIcon={<Trash2 className="text-red-500" size={14} strokeWidth={2} />}
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
});
