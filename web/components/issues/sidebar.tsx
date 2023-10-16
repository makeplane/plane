import React, { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
import { Controller, UseFormWatch } from "react-hook-form";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
import useUserIssueNotificationSubscription from "hooks/use-issue-notification-subscription";
import useEstimateOption from "hooks/use-estimate-option";
// services
import { IssueService } from "services/issue";
import { ModuleService } from "services/module.service";
// contexts
import { useProjectMyMembership } from "contexts/project-member.context";
// components
import { LinkModal, LinksList } from "components/core";
import {
  DeleteIssueModal,
  SidebarAssigneeSelect,
  SidebarBlockedSelect,
  SidebarBlockerSelect,
  SidebarCycleSelect,
  SidebarModuleSelect,
  SidebarParentSelect,
  SidebarPrioritySelect,
  SidebarStateSelect,
  SidebarEstimateSelect,
  SidebarLabelSelect,
  SidebarDuplicateSelect,
  SidebarRelatesSelect,
} from "components/issues";
// ui
import { CustomDatePicker, Icon } from "components/ui";
// icons
import {
  LinkIcon,
  CalendarDaysIcon,
  TrashIcon,
  PlusIcon,
  Squares2X2Icon,
  ChartBarIcon,
  UserGroupIcon,
  PlayIcon,
  UserIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/outline";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import type { ICycle, IIssue, IIssueLink, linkDetails, IModule } from "types";
// fetch-keys
import { ISSUE_DETAILS, PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";
import { ContrastIcon } from "components/icons";

type Props = {
  control: any;
  submitChanges: (formData: any) => void;
  issueDetail: IIssue | undefined;
  watch: UseFormWatch<IIssue>;
  fieldsToShow?: (
    | "state"
    | "assignee"
    | "priority"
    | "estimate"
    | "parent"
    | "blocker"
    | "blocked"
    | "startDate"
    | "dueDate"
    | "cycle"
    | "module"
    | "label"
    | "link"
    | "delete"
    | "all"
    | "subscribe"
    | "duplicate"
    | "relates_to"
  )[];
  uneditable?: boolean;
};

const issueService = new IssueService();
const moduleService = new ModuleService();

export const IssueDetailsSidebar: React.FC<Props> = ({
  control,
  submitChanges,
  issueDetail,
  watch: watchIssue,
  fieldsToShow = ["all"],
  uneditable = false,
}) => {
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [linkModal, setLinkModal] = useState(false);
  const [selectedLinkToUpdate, setSelectedLinkToUpdate] = useState<linkDetails | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { user } = useUserAuth();

  const { isEstimateActive } = useEstimateOption();

  const { loading, handleSubscribe, handleUnsubscribe, subscribed } = useUserIssueNotificationSubscription(
    workspaceSlug,
    projectId,
    issueId
  );

  const { memberRole } = useProjectMyMembership();

  const { setToastAlert } = useToast();

  const handleCycleChange = useCallback(
    (cycleDetails: ICycle) => {
      if (!workspaceSlug || !projectId || !issueDetail) return;

      issueService
        .addIssueToCycle(
          workspaceSlug as string,
          projectId as string,
          cycleDetails.id,
          {
            issues: [issueDetail.id],
          },
          user
        )
        .then(() => {
          mutate(ISSUE_DETAILS(issueId as string));
        });
    },
    [workspaceSlug, projectId, issueId, issueDetail, user]
  );

  const handleModuleChange = useCallback(
    (moduleDetail: IModule) => {
      if (!workspaceSlug || !projectId || !issueDetail) return;

      moduleService
        .addIssuesToModule(
          workspaceSlug as string,
          projectId as string,
          moduleDetail.id,
          {
            issues: [issueDetail.id],
          },
          user
        )
        .then(() => {
          mutate(ISSUE_DETAILS(issueId as string));
        });
    },
    [workspaceSlug, projectId, issueId, issueDetail, user]
  );

  const handleCreateLink = async (formData: IIssueLink) => {
    if (!workspaceSlug || !projectId || !issueDetail) return;

    const payload = { metadata: {}, ...formData };

    await issueService
      .createIssueLink(workspaceSlug as string, projectId as string, issueDetail.id, payload)
      .then(() => mutate(ISSUE_DETAILS(issueDetail.id)))
      .catch((err) => {
        if (err.status === 400)
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "This URL already exists for this issue.",
          });
        else
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Something went wrong. Please try again.",
          });
      });
  };

  const handleUpdateLink = async (formData: IIssueLink, linkId: string) => {
    if (!workspaceSlug || !projectId || !issueDetail) return;

    const payload = { metadata: {}, ...formData };

    const updatedLinks = issueDetail.issue_link.map((l) =>
      l.id === linkId
        ? {
            ...l,
            title: formData.title,
            url: formData.url,
          }
        : l
    );

    mutate<IIssue>(
      ISSUE_DETAILS(issueDetail.id),
      (prevData) => ({ ...(prevData as IIssue), issue_link: updatedLinks }),
      false
    );

    await issueService
      .updateIssueLink(workspaceSlug as string, projectId as string, issueDetail.id, linkId, payload)
      .then(() => {
        mutate(ISSUE_DETAILS(issueDetail.id));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!workspaceSlug || !projectId || !issueDetail) return;

    const updatedLinks = issueDetail.issue_link.filter((l) => l.id !== linkId);

    mutate<IIssue>(
      ISSUE_DETAILS(issueDetail.id),
      (prevData) => ({ ...(prevData as IIssue), issue_link: updatedLinks }),
      false
    );

    await issueService
      .deleteIssueLink(workspaceSlug as string, projectId as string, issueDetail.id, linkId)
      .then(() => {
        mutate(ISSUE_DETAILS(issueDetail.id));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleCopyText = () => {
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/issues/${issueDetail?.id}`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  const showFirstSection =
    fieldsToShow.includes("all") ||
    fieldsToShow.includes("state") ||
    fieldsToShow.includes("assignee") ||
    fieldsToShow.includes("priority") ||
    fieldsToShow.includes("estimate");

  const showSecondSection =
    fieldsToShow.includes("all") ||
    fieldsToShow.includes("parent") ||
    fieldsToShow.includes("blocker") ||
    fieldsToShow.includes("blocked") ||
    fieldsToShow.includes("dueDate");

  const showThirdSection =
    fieldsToShow.includes("all") || fieldsToShow.includes("cycle") || fieldsToShow.includes("module");

  const startDate = watchIssue("start_date");
  const targetDate = watchIssue("target_date");

  const minDate = startDate ? new Date(startDate) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = targetDate ? new Date(targetDate) : null;
  maxDate?.setDate(maxDate.getDate());

  const handleEditLink = (link: linkDetails) => {
    setSelectedLinkToUpdate(link);
    setLinkModal(true);
  };

  const isNotAllowed = memberRole.isGuest || memberRole.isViewer;

  return (
    <>
      <LinkModal
        isOpen={linkModal}
        handleClose={() => {
          setLinkModal(false);
          setSelectedLinkToUpdate(null);
        }}
        data={selectedLinkToUpdate}
        status={selectedLinkToUpdate ? true : false}
        createIssueLink={handleCreateLink}
        updateIssueLink={handleUpdateLink}
      />
      <DeleteIssueModal
        handleClose={() => setDeleteIssueModal(false)}
        isOpen={deleteIssueModal}
        data={issueDetail ?? null}
        user={user}
      />
      <div className="h-full w-full flex flex-col divide-y-2 divide-custom-border-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 pb-3">
          <h4 className="text-sm font-medium">
            {issueDetail?.project_detail?.identifier}-{issueDetail?.sequence_id}
          </h4>
          <div className="flex flex-wrap items-center gap-2">
            {issueDetail?.created_by !== user?.id &&
              !issueDetail?.assignees.includes(user?.id ?? "") &&
              !router.pathname.includes("[archivedIssueId]") &&
              (fieldsToShow.includes("all") || fieldsToShow.includes("subscribe")) && (
                <button
                  type="button"
                  className="rounded-md flex items-center gap-2 border border-custom-primary-100 px-2 py-1 text-xs text-custom-primary-100 shadow-sm duration-300 focus:outline-none"
                  onClick={() => {
                    if (subscribed) handleUnsubscribe();
                    else handleSubscribe();
                  }}
                >
                  <Icon iconName="notifications" />
                  {loading ? "Loading..." : subscribed ? "Unsubscribe" : "Subscribe"}
                </button>
              )}
            {(fieldsToShow.includes("all") || fieldsToShow.includes("link")) && (
              <button
                type="button"
                className="rounded-md border border-custom-border-200 p-2 shadow-sm duration-300 hover:bg-custom-background-90 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary"
                onClick={handleCopyText}
              >
                <LinkIcon className="h-3.5 w-3.5" />
              </button>
            )}
            {!isNotAllowed && (fieldsToShow.includes("all") || fieldsToShow.includes("delete")) && (
              <button
                type="button"
                className="rounded-md border border-red-500 p-2 text-red-500 shadow-sm duration-300 hover:bg-red-500/20 focus:outline-none"
                onClick={() => setDeleteIssueModal(true)}
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="h-full w-full px-5 overflow-y-auto">
          <div className={`divide-y-2 divide-custom-border-200 ${uneditable ? "opacity-60" : ""}`}>
            {showFirstSection && (
              <div className="py-1">
                {(fieldsToShow.includes("all") || fieldsToShow.includes("state")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
                      <Squares2X2Icon className="h-4 w-4 flex-shrink-0" />
                      <p>State</p>
                    </div>
                    <div className="sm:basis-1/2">
                      <Controller
                        control={control}
                        name="state"
                        render={({ field: { value } }) => (
                          <SidebarStateSelect
                            value={value}
                            onChange={(val: string) => submitChanges({ state: val })}
                            disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("assignee")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
                      <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
                      <p>Assignees</p>
                    </div>
                    <div className="sm:basis-1/2">
                      <Controller
                        control={control}
                        name="assignees_list"
                        render={({ field: { value } }) => (
                          <SidebarAssigneeSelect
                            value={value}
                            onChange={(val: string[]) => submitChanges({ assignees_list: val })}
                            disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("priority")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
                      <ChartBarIcon className="h-4 w-4 flex-shrink-0" />
                      <p>Priority</p>
                    </div>
                    <div className="sm:basis-1/2">
                      <Controller
                        control={control}
                        name="priority"
                        render={({ field: { value } }) => (
                          <SidebarPrioritySelect
                            value={value}
                            onChange={(val) => submitChanges({ priority: val })}
                            disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("estimate")) && isEstimateActive && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
                      <PlayIcon className="h-4 w-4 flex-shrink-0 -rotate-90" />
                      <p>Estimate</p>
                    </div>
                    <div className="sm:basis-1/2">
                      <Controller
                        control={control}
                        name="estimate_point"
                        render={({ field: { value } }) => (
                          <SidebarEstimateSelect
                            value={value}
                            onChange={(val: number | null) => submitChanges({ estimate_point: val })}
                            disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {showSecondSection && (
              <div className="py-1">
                {(fieldsToShow.includes("all") || fieldsToShow.includes("parent")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
                      <UserIcon className="h-4 w-4 flex-shrink-0" />
                      <p>Parent</p>
                    </div>
                    <div className="sm:basis-1/2">
                      <Controller
                        control={control}
                        name="parent"
                        render={({ field: { onChange } }) => (
                          <SidebarParentSelect
                            onChange={(val: string) => {
                              submitChanges({ parent: val });
                              onChange(val);
                            }}
                            issueDetails={issueDetail}
                            disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("blocker")) && (
                  <SidebarBlockerSelect
                    issueId={issueId as string}
                    submitChanges={(data: any) => {
                      mutate<IIssue>(
                        ISSUE_DETAILS(issueId as string),
                        (prevData) => {
                          if (!prevData) return prevData;
                          return {
                            ...prevData,
                            ...data,
                          };
                        },
                        false
                      );
                      mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
                    }}
                    watch={watchIssue}
                    disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("blocked")) && (
                  <SidebarBlockedSelect
                    issueId={issueId as string}
                    submitChanges={(data: any) => {
                      mutate<IIssue>(
                        ISSUE_DETAILS(issueId as string),
                        (prevData) => {
                          if (!prevData) return prevData;
                          return {
                            ...prevData,
                            ...data,
                          };
                        },
                        false
                      );
                      mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
                    }}
                    watch={watchIssue}
                    disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("duplicate")) && (
                  <SidebarDuplicateSelect
                    issueId={issueId as string}
                    submitChanges={(data: any) => {
                      if (!data) return mutate(ISSUE_DETAILS(issueId as string));
                      mutate<IIssue>(ISSUE_DETAILS(issueId as string), (prevData) => {
                        if (!prevData) return prevData;
                        return {
                          ...prevData,
                          ...data,
                        };
                      });
                      mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
                    }}
                    watch={watchIssue}
                    disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("relates_to")) && (
                  <SidebarRelatesSelect
                    issueId={issueId as string}
                    submitChanges={(data: any) => {
                      if (!data) return mutate(ISSUE_DETAILS(issueId as string));
                      mutate<IIssue>(ISSUE_DETAILS(issueId as string), (prevData) => {
                        if (!prevData) return prevData;
                        return {
                          ...prevData,
                          ...data,
                        };
                      });
                      mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
                    }}
                    watch={watchIssue}
                    disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("startDate")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
                      <CalendarDaysIcon className="h-4 w-4 flex-shrink-0" />
                      <p>Start date</p>
                    </div>
                    <div className="sm:basis-1/2">
                      <Controller
                        control={control}
                        name="start_date"
                        render={({ field: { value } }) => (
                          <CustomDatePicker
                            placeholder="Start date"
                            value={value}
                            onChange={(val) =>
                              submitChanges({
                                start_date: val,
                              })
                            }
                            className="bg-custom-background-80 border-none"
                            maxDate={maxDate ?? undefined}
                            disabled={isNotAllowed || uneditable}
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("dueDate")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
                      <CalendarDaysIcon className="h-4 w-4 flex-shrink-0" />
                      <p>Due date</p>
                    </div>
                    <div className="sm:basis-1/2">
                      <Controller
                        control={control}
                        name="target_date"
                        render={({ field: { value } }) => (
                          <CustomDatePicker
                            placeholder="Due date"
                            value={value}
                            onChange={(val) =>
                              submitChanges({
                                target_date: val,
                              })
                            }
                            className="bg-custom-background-80 border-none"
                            minDate={minDate ?? undefined}
                            disabled={isNotAllowed || uneditable}
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {showThirdSection && (
              <div className="py-1">
                {(fieldsToShow.includes("all") || fieldsToShow.includes("cycle")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                      <ContrastIcon className="h-4 w-4 flex-shrink-0" />
                      <p>Cycle</p>
                    </div>
                    <div className="space-y-1 sm:w-1/2">
                      <SidebarCycleSelect
                        issueDetail={issueDetail}
                        handleCycleChange={handleCycleChange}
                        disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
                      />
                    </div>
                  </div>
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("module")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                      <RectangleGroupIcon className="h-4 w-4 flex-shrink-0" />
                      <p>Module</p>
                    </div>
                    <div className="space-y-1 sm:w-1/2">
                      <SidebarModuleSelect
                        issueDetail={issueDetail}
                        handleModuleChange={handleModuleChange}
                        disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {(fieldsToShow.includes("all") || fieldsToShow.includes("label")) && (
            <SidebarLabelSelect
              issueDetails={issueDetail}
              issueControl={control}
              watchIssue={watchIssue}
              submitChanges={submitChanges}
              isNotAllowed={isNotAllowed}
              uneditable={uneditable ?? false}
            />
          )}
          {(fieldsToShow.includes("all") || fieldsToShow.includes("link")) && (
            <div className={`min-h-[116px] py-1 text-xs ${uneditable ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <h4>Links</h4>
                {!isNotAllowed && (
                  <button
                    type="button"
                    className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-custom-background-90 ${
                      uneditable ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                    onClick={() => setLinkModal(true)}
                    disabled={uneditable}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-2 space-y-2">
                {issueDetail?.issue_link && issueDetail.issue_link.length > 0 ? (
                  <LinksList
                    links={issueDetail.issue_link}
                    handleDeleteLink={handleDeleteLink}
                    handleEditLink={handleEditLink}
                    userAuth={memberRole}
                  />
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
