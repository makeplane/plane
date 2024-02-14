import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import DatePicker from "react-datepicker";
import { Menu, Popover } from "@headlessui/react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileStack,
  MoreVertical,
  PanelLeft,
  PanelRight,
  Trash2,
  XCircle,
} from "lucide-react";
// hooks
import { useUser, useInboxIssues, useIssueDetail, useWorkspace, useEventTracker } from "hooks/store";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
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
// helpers
import { cn } from "helpers/common.helper";
// types
import type { TInboxStatus, TInboxDetailedStatus } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";
import { ISSUE_DELETED } from "constants/event-tracker";

type Props = {
  workspaceSlug: string;
  projectId: string;
  inboxId: string;
  inboxIssueId: string | undefined;
  isIssueDetailSidebarOpen: boolean;
  setIsIssueDetailSidebarOpen: (isOpen: boolean) => void;
  isInboxSidebarOpen: boolean;
  setIsInboxSidebarOpen: (isOpen: boolean) => void;
};

type TInboxIssueOperations = {
  updateInboxIssueStatus: (data: TInboxStatus) => Promise<void>;
  removeInboxIssue: () => Promise<void>;
};

export const MobileInboxIssuesActionHeader: React.FC<Props> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    inboxId,
    inboxIssueId,
    isIssueDetailSidebarOpen,
    setIsIssueDetailSidebarOpen,
    isInboxSidebarOpen,
    setIsInboxSidebarOpen,
  } = props;

  // router
  const router = useRouter();
  // hooks
  const { captureIssueEvent } = useEventTracker();
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
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  // refs
  const snoozeRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
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
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: {
              id: inboxIssueId,
              state: "SUCCESS",
              element: "Inbox page",
            },
          });
          router.push({
            pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
          });
        } catch (error) {
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Something went wrong while deleting inbox issue. Please try again.",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: {
              id: inboxIssueId,
              state: "FAILED",
              element: "Inbox page",
            },
          });
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
      captureIssueEvent,
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

  const isAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  const isInboxIssueOpen = issueStatus && issue && inboxIssues;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  useEffect(() => {
    if (!issueStatus || !issueStatus.snoozed_till) return;
    setDate(new Date(issueStatus.snoozed_till));
  }, [issueStatus]);

  const issueActions = [
    {
      label: "Snooze",
      icon: <Clock size={14} strokeWidth={2} />,
      onClick: () => {
        if (!issueStatus) return;
        setShowSnoozeModal(true);
      },
      show: isAllowed && (issueStatus?.status === 0 || issueStatus?.status === -2),
    },
    {
      label: "Duplicate",
      icon: <FileStack size={14} strokeWidth={2} />,
      onClick: () => setSelectDuplicateIssue(true),
      show: isAllowed && issueStatus?.status === -2,
    },
    {
      label: "Accept",
      icon: <CheckCircle2 className="text-green-500" size={14} strokeWidth={2} />,
      onClick: () => setAcceptIssueModal(true),
      show: isAllowed && (issueStatus?.status === 0 || issueStatus?.status === -2),
    },
    {
      label: "Decline",
      icon: <XCircle className="text-red-500" size={14} strokeWidth={2} />,
      onClick: () => setDeclineIssueModal(true),
      show: isAllowed && issueStatus?.status === -2,
    },
    {
      label: "Delete",
      icon: <Trash2 className="text-red-500" size={14} strokeWidth={2} />,
      onClick: () => setDeleteIssueModal(true),
      show: isAllowed || currentUser?.id === issue?.created_by,
    },
  ];

  useOutsideClickDetector(snoozeRef, () => {
    if (showSnoozeModal) setShowActionMenu(false);
    setShowSnoozeModal(false);
  });
  useOutsideClickDetector(menuRef, () => {
    if (!showSnoozeModal) setShowActionMenu(false);
  });
  return (
    <>
      {issue && (
        <>
          <SelectDuplicateInboxIssueModal
            isOpen={selectDuplicateIssue}
            onClose={() => setSelectDuplicateIssue(false)}
            value={issueStatus?.duplicate_to}
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
              await inboxIssueOperations.removeInboxIssue().finally(() => setDeleteIssueModal(false));
            }}
          />

          <Popover ref={snoozeRef} className="absolute flex items-center justify-center z-40 w-full">
            {showSnoozeModal && (
              <Popover.Panel
                as="div"
                className="absolute z-20 p-2 top-16 rounded-md bg-custom-background-100 shadow-lg"
                static
              >
                <div className="flex h-full w-full flex-col gap-y-1">
                  <DatePicker
                    className="bg-custom-background-100 border border-custom-border-200 rounded-md text-custom-text-200"
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
                      setShowSnoozeModal(false);
                      setShowActionMenu(false);
                      inboxIssueOperations.updateInboxIssueStatus({
                        status: 0,
                        snoozed_till: new Date(date),
                      });
                    }}
                  >
                    Snooze
                  </Button>
                </div>
              </Popover.Panel>
            )}
          </Popover>
        </>
      )}

      <div className="relative h-full w-full flex items-center px-4 gap-x-4">
        <button
          className="pr"
          onClick={() => {
            setIsIssueDetailSidebarOpen(false);
            setIsInboxSidebarOpen(!isInboxSidebarOpen);
          }}
        >
          <PanelLeft
            className={cn("w-4 h-4 ", isInboxSidebarOpen ? "text-custom-primary-100 " : " text-custom-text-200")}
          />
        </button>
        {isInboxIssueOpen && (
          <div className="flex items-center gap-x-2 mr-auto">
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
        )}
        {isInboxIssueOpen && (
          <Menu ref={menuRef} as="div" className={" w-min text-left"}>
            <>
              <button
                onClick={(e) => {
                  setShowActionMenu(true);
                }}
                className="flex w-full items-center gap-x-2 rounded p-0.5 text-sm"
              >
                <MoreVertical className="h-3.5 w-3.5 text-custom-text-300" />
              </button>

              {showActionMenu && (
                <Menu.Items className={"absolute right-5 z-30"} static>
                  <div
                    className={
                      "my-1 overflow-y-scroll rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg text-custom-text-200 focus:outline-none min-w-[12rem] whitespace-nowrap"
                    }
                  >
                    {issueActions.map(
                      (action, index) =>
                        action.show && (
                          <Menu.Item as="div">
                            <button
                              onClick={(e) => {
                                action.onClick();
                                if (index == 0) {
                                  e.preventDefault();
                                } else setShowActionMenu(false);
                              }}
                              className="flex gap-x-2 items-center p-1.5"
                            >
                              {action.icon}
                              {action.label}
                            </button>
                          </Menu.Item>
                        )
                    )}
                  </div>
                </Menu.Items>
              )}
            </>
          </Menu>
        )}
        {isInboxIssueOpen && (
          <button
            className="block md:hidden"
            onClick={() => {
              setIsInboxSidebarOpen(false);
              setIsIssueDetailSidebarOpen(!isIssueDetailSidebarOpen);
            }}
          >
            <PanelRight
              className={cn("w-4 h-4 ", isIssueDetailSidebarOpen ? "text-custom-primary-100" : " text-custom-text-200")}
            />
          </button>
        )}
      </div>
    </>
  );
});
