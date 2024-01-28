import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import DatePicker from "react-datepicker";
import { Popover } from "@headlessui/react";
// hooks
import { useApplication, useUser, useInboxIssues, useIssueDetail, useWorkspace } from "hooks/store";
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
import { CheckCircle2, ChevronDown, ChevronUp, Clock, FileStack, Trash2, XCircle } from "lucide-react";
// types
import type { TInboxStatus, TInboxDetailedStatus } from "@plane/types";
import { EUserProjectRoles } from "constants/project";

type TInboxIssueActionsHeader = {
  workspaceSlug: string;
  projectId: string;
  inboxId: string;
  inboxIssueId: string | undefined;
};

type TInboxIssueOperations = {
  updateInboxIssueStatus: (data: TInboxStatus) => Promise<void>;
  removeInboxIssue: () => Promise<void>;
};

export const InboxIssueActionsHeader: FC<TInboxIssueActionsHeader> = observer((props) => {
  const { workspaceSlug, projectId, inboxId, inboxIssueId } = props;
  // router
  const router = useRouter();
  // hooks
  const {
    eventTracker: { postHogEventTracker },
  } = useApplication();
  const { currentWorkspace } = useWorkspace();
  const {
    issues: { getInboxIssuesByInboxId, getInboxIssueByIssueId, updateInboxIssueStatus, removeInboxIssue },
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

  const inboxIssueOperations: TInboxIssueOperations = useMemo(
    () => ({
      updateInboxIssueStatus: async (data: TInboxDetailedStatus) => {
        try {
          if (!workspaceSlug || !projectId || !inboxId || !inboxIssueId) throw new Error("Missing required parameters");
          await updateInboxIssueStatus(workspaceSlug, projectId, inboxId, inboxIssueId, data);
        } catch (error) {
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Something went wrong while updating inbox status. Please try again.",
          });
        }
      },
      removeInboxIssue: async () => {
        try {
          if (!workspaceSlug || !projectId || !inboxId || !inboxIssueId || !currentWorkspace)
            throw new Error("Missing required parameters");
          await removeInboxIssue(workspaceSlug, projectId, inboxId, inboxIssueId);
          postHogEventTracker(
            "ISSUE_DELETED",
            {
              state: "SUCCESS",
            },
            {
              isGrouping: true,
              groupType: "Workspace_metrics",
              groupId: currentWorkspace?.id!,
            }
          );
          router.push({
            pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
          });
        } catch (error) {
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Something went wrong while deleting inbox issue. Please try again.",
          });
          postHogEventTracker(
            "ISSUE_DELETED",
            {
              state: "FAILED",
            },
            {
              isGrouping: true,
              groupType: "Workspace_metrics",
              groupId: currentWorkspace?.id!,
            }
          );
        }
      },
    }),
    [
      currentWorkspace,
      workspaceSlug,
      projectId,
      inboxId,
      inboxIssueId,
      updateInboxIssueStatus,
      removeInboxIssue,
      setToastAlert,
      postHogEventTracker,
      router,
    ]
  );

  const handleInboxIssueNavigation = useCallback(
    (direction: "next" | "prev") => {
      if (!inboxIssues || !inboxIssueId) return;
      const nextIssueIndex =
        direction === "next"
          ? (currentIssueIndex + 1) % inboxIssues.length
          : (currentIssueIndex - 1 + inboxIssues.length) % inboxIssues.length;
      const nextIssueId = inboxIssues[nextIssueIndex];
      if (!nextIssueId) return;
      router.push({
        pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
        query: {
          inboxIssueId: nextIssueId,
        },
      });
    },
    [workspaceSlug, projectId, inboxId, inboxIssues, inboxIssueId, currentIssueIndex, router]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        handleInboxIssueNavigation("prev");
      } else if (e.key === "ArrowDown") {
        handleInboxIssueNavigation("next");
      }
    },
    [handleInboxIssueNavigation]
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  const isAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  useEffect(() => {
    if (!issueStatus || !issueStatus.snoozed_till) return;
    setDate(new Date(issueStatus.snoozed_till));
  }, [issueStatus]);

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
              inboxIssueOperations
                .updateInboxIssueStatus({
                  status: 2,
                  duplicate_to: dupIssueId,
                })
                .finally(() => setSelectDuplicateIssue(false));
            }}
          />

          <AcceptIssueModal
            data={issue}
            isOpen={acceptIssueModal}
            onClose={() => setAcceptIssueModal(false)}
            onSubmit={async () => {
              await inboxIssueOperations
                .updateInboxIssueStatus({
                  status: 1,
                })
                .finally(() => setAcceptIssueModal(false));
            }}
          />

          <DeclineIssueModal
            data={issue}
            isOpen={declineIssueModal}
            onClose={() => setDeclineIssueModal(false)}
            onSubmit={async () => {
              await inboxIssueOperations
                .updateInboxIssueStatus({
                  status: -1,
                })
                .finally(() => setDeclineIssueModal(false));
            }}
          />

          <DeleteInboxIssueModal
            data={issue}
            isOpen={deleteIssueModal}
            onClose={() => setDeleteIssueModal(false)}
            onSubmit={async () => {
              await inboxIssueOperations.removeInboxIssue().finally(() => setDeclineIssueModal(false));
            }}
          />
        </>
      )}

      {inboxIssueId && (
        <div className="px-4 w-full h-full relative flex items-center gap-2 justify-between">
          <div className="flex items-center gap-x-2">
            <button
              type="button"
              className="rounded border border-custom-border-200 bg-custom-background-90 p-1.5 hover:bg-custom-background-80"
              onClick={() => handleInboxIssueNavigation("prev")}
            >
              <ChevronUp size={14} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="rounded border border-custom-border-200 bg-custom-background-90 p-1.5 hover:bg-custom-background-80"
              onClick={() => handleInboxIssueNavigation("next")}
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
                            inboxIssueOperations.updateInboxIssueStatus({
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
