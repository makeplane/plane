import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import DatePicker from "react-datepicker";
import { Popover } from "@headlessui/react";
// hooks
import { useUser, useInboxIssues, useIssueDetail } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import {
  AcceptIssueModal,
  DeclineIssueModal,
  DeleteInboxIssueModal,
  SelectDuplicateInboxIssueModal,
} from "components/inbox";
// ui
import { Button } from "@plane/ui";
// icons
import { CheckCircle2, ChevronDown, ChevronUp, Clock, FileStack, Inbox, Trash2, XCircle } from "lucide-react";
// types
import type { TInboxStatus } from "@plane/types";
import { EUserProjectRoles } from "constants/project";

type TInboxIssueActionsHeader = {
  workspaceSlug: string;
  projectId: string;
  inboxId: string;
  inboxIssueId: string | undefined;
};

export const InboxIssueActionsHeader: FC<TInboxIssueActionsHeader> = observer((props) => {
  const { workspaceSlug, projectId, inboxId, inboxIssueId } = props;
  // hooks
  const {
    issues: { getInboxIssuesByInboxId, getInboxIssueByIssueId, updateInboxIssueStatus },
  } = useInboxIssues();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const {
    currentUser,
    membership: { currentProjectRole },
  } = useUser();
  const { setToastAlert } = useToast();

  // states
  const [date, setDate] = useState(new Date());
  const [selectDuplicateIssue, setSelectDuplicateIssue] = useState(false);
  const [acceptIssueModal, setAcceptIssueModal] = useState(false);
  const [declineIssueModal, setDeclineIssueModal] = useState(false);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

  // derived values
  const inboxIssues = getInboxIssuesByInboxId(inboxId);
  const issueStatus = (inboxIssueId && inboxId && getInboxIssueByIssueId(inboxId, inboxIssueId)) || undefined;
  const issue = (inboxIssueId && getIssueById(inboxIssueId)) || undefined;

  const currentIssueIndex = inboxIssues?.findIndex((issue) => issue === inboxIssueId) ?? 0;

  const markInboxStatus = async (data: TInboxStatus) => {
    if (!workspaceSlug || !projectId || !inboxId || !inboxIssueId || !issue) return;

    await updateInboxIssueStatus(workspaceSlug, projectId, inboxId, inboxIssueId, data).catch(() =>
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Something went wrong while updating inbox status. Please try again.",
      })
    );
  };

  useEffect(() => {
    if (!issueStatus || !issueStatus.snoozed_till) return;
    setDate(new Date(issueStatus.snoozed_till));
  }, [issueStatus]);

  const isAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const today = new Date();
  const tomorrow = new Date(today);

  tomorrow.setDate(today.getDate() + 1);

  if (!issueStatus || !issue || !inboxIssues) return <></>;
  return (
    <>
      {issue && (
        <>
          <SelectDuplicateInboxIssueModal
            isOpen={selectDuplicateIssue}
            onClose={() => setSelectDuplicateIssue(false)}
            value={issueStatus.duplicate_to}
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

          <DeleteInboxIssueModal isOpen={deleteIssueModal} onClose={() => setDeleteIssueModal(false)} />
        </>
      )}

      {inboxIssueId && (
        <div className="px-4 w-full h-full relative flex items-center gap-2 justify-between">
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
              {currentIssueIndex + 1}/{inboxIssues?.length ?? 0}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAllowed && (issueStatus.status === 0 || issueStatus.status === -2) && (
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

            {isAllowed && issueStatus.status === -2 && (
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

            {isAllowed && (issueStatus.status === 0 || issueStatus.status === -2) && (
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

            {isAllowed && issueStatus.status === -2 && (
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

            {(isAllowed || currentUser?.id === issue?.created_by) && (
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
    </>
  );
});
