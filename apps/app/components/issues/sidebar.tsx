import React, { useCallback, useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-hook-form
import { useForm, Controller, UseFormWatch, Control } from "react-hook-form";
// react-color
import { TwitterPicker } from "react-color";
// headless ui
import { Popover, Listbox, Transition } from "@headlessui/react";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// services
import issuesService from "services/issues.service";
import modulesService from "services/modules.service";
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
} from "components/issues";
// ui
import { Input, Spinner, CustomDatePicker } from "components/ui";
// icons
import {
  TagIcon,
  ChevronDownIcon,
  LinkIcon,
  CalendarDaysIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/outline";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import type { ICycle, IIssue, IIssueLabels, IIssueLink, IModule } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS, PROJECT_ISSUES_LIST, ISSUE_DETAILS } from "constants/fetch-keys";

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
    | "dueDate"
    | "cycle"
    | "module"
    | "label"
    | "link"
    | "delete"
    | "all"
  )[];
  uneditable?: boolean;
};

const defaultValues: Partial<IIssueLabels> = {
  name: "",
  color: "#ff0000",
};

export const IssueDetailsSidebar: React.FC<Props> = ({
  control,
  submitChanges,
  issueDetail,
  watch: watchIssue,
  fieldsToShow = ["all"],
  uneditable = false,
}) => {
  const [createLabelForm, setCreateLabelForm] = useState(false);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [linkModal, setLinkModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { user } = useUserAuth();

  const { memberRole } = useProjectMyMembership();

  const { setToastAlert } = useToast();

  const { data: issues } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssues(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: issueLabels, mutate: issueLabelMutate } = useSWR<IIssueLabels[]>(
    workspaceSlug && projectId ? PROJECT_ISSUE_LABELS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssueLabels(workspaceSlug as string, projectId as string)
      : null
  );

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
    watch,
    control: controlLabel,
  } = useForm({
    defaultValues,
  });

  const handleNewLabel = (formData: any) => {
    if (!workspaceSlug || !projectId || isSubmitting) return;
    issuesService
      .createIssueLabel(workspaceSlug as string, projectId as string, formData, user)
      .then((res) => {
        reset(defaultValues);
        issueLabelMutate((prevData) => [...(prevData ?? []), res], false);
        submitChanges({ labels_list: [...(issueDetail?.labels ?? []), res.id] });
        setCreateLabelForm(false);
      });
  };

  const handleCycleChange = useCallback(
    (cycleDetails: ICycle) => {
      if (!workspaceSlug || !projectId || !issueDetail) return;

      issuesService
        .addIssueToCycle(
          workspaceSlug as string,
          projectId as string,
          cycleDetails.id,
          {
            issues: [issueDetail.id],
          },
          user
        )
        .then((res) => {
          mutate(ISSUE_DETAILS(issueId as string));
        });
    },
    [workspaceSlug, projectId, issueId, issueDetail, user]
  );

  const handleModuleChange = useCallback(
    (moduleDetail: IModule) => {
      if (!workspaceSlug || !projectId || !issueDetail) return;

      modulesService
        .addIssuesToModule(
          workspaceSlug as string,
          projectId as string,
          moduleDetail.id,
          {
            issues: [issueDetail.id],
          },
          user
        )
        .then((res) => {
          mutate(ISSUE_DETAILS(issueId as string));
        });
    },
    [workspaceSlug, projectId, issueId, issueDetail, user]
  );

  const handleCreateLink = async (formData: IIssueLink) => {
    if (!workspaceSlug || !projectId || !issueDetail) return;

    const payload = { metadata: {}, ...formData };

    await issuesService
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

  const handleDeleteLink = async (linkId: string) => {
    if (!workspaceSlug || !projectId || !issueDetail) return;

    const updatedLinks = issueDetail.issue_link.filter((l) => l.id !== linkId);

    mutate<IIssue>(
      ISSUE_DETAILS(issueDetail.id),
      (prevData) => ({ ...(prevData as IIssue), issue_link: updatedLinks }),
      false
    );

    await issuesService
      .deleteIssueLink(workspaceSlug as string, projectId as string, issueDetail.id, linkId)
      .then((res) => {
        mutate(ISSUE_DETAILS(issueDetail.id));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleCopyText = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(
      `${originURL}/${workspaceSlug}/projects/${projectId}/issues/${issueDetail?.id}`
    ).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  useEffect(() => {
    if (!createLabelForm) return;

    reset();
  }, [createLabelForm, reset]);

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
    fieldsToShow.includes("all") ||
    fieldsToShow.includes("cycle") ||
    fieldsToShow.includes("module");

  const isNotAllowed = memberRole.isGuest || memberRole.isViewer;

  return (
    <>
      <LinkModal
        isOpen={linkModal}
        handleClose={() => setLinkModal(false)}
        onFormSubmit={handleCreateLink}
      />
      <DeleteIssueModal
        handleClose={() => setDeleteIssueModal(false)}
        isOpen={deleteIssueModal}
        data={issueDetail ?? null}
        user={user}
      />
      <div className="sticky top-5 w-full divide-y-2 divide-custom-border-100">
        <div className="flex items-center justify-between pb-3">
          <h4 className="text-sm font-medium">
            {issueDetail?.project_detail?.identifier}-{issueDetail?.sequence_id}
          </h4>
          <div className="flex flex-wrap items-center gap-2">
            {(fieldsToShow.includes("all") || fieldsToShow.includes("link")) && (
              <button
                type="button"
                className="rounded-md border border-custom-border-100 p-2 shadow-sm duration-300 hover:bg-custom-background-90 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary"
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

        <div className={`divide-y-2 divide-custom-border-100 ${uneditable ? "opacity-60" : ""}`}>
          {showFirstSection && (
            <div className="py-1">
              {(fieldsToShow.includes("all") || fieldsToShow.includes("state")) && (
                <Controller
                  control={control}
                  name="state"
                  render={({ field: { value } }) => (
                    <SidebarStateSelect
                      value={value}
                      onChange={(val: string) => submitChanges({ state: val })}
                      userAuth={memberRole}
                      disabled={uneditable}
                    />
                  )}
                />
              )}
              {(fieldsToShow.includes("all") || fieldsToShow.includes("assignee")) && (
                <Controller
                  control={control}
                  name="assignees_list"
                  render={({ field: { value } }) => (
                    <SidebarAssigneeSelect
                      value={value}
                      onChange={(val: string[]) => submitChanges({ assignees_list: val })}
                      userAuth={memberRole}
                      disabled={uneditable}
                    />
                  )}
                />
              )}
              {(fieldsToShow.includes("all") || fieldsToShow.includes("priority")) && (
                <Controller
                  control={control}
                  name="priority"
                  render={({ field: { value } }) => (
                    <SidebarPrioritySelect
                      value={value}
                      onChange={(val: string) => submitChanges({ priority: val })}
                      userAuth={memberRole}
                      disabled={uneditable}
                    />
                  )}
                />
              )}
              {(fieldsToShow.includes("all") || fieldsToShow.includes("estimate")) && (
                <Controller
                  control={control}
                  name="estimate_point"
                  render={({ field: { value } }) => (
                    <SidebarEstimateSelect
                      value={value}
                      onChange={(val: number | null) => submitChanges({ estimate_point: val })}
                      userAuth={memberRole}
                      disabled={uneditable}
                    />
                  )}
                />
              )}
            </div>
          )}
          {showSecondSection && (
            <div className="py-1">
              {(fieldsToShow.includes("all") || fieldsToShow.includes("parent")) && (
                <SidebarParentSelect
                  control={control}
                  submitChanges={submitChanges}
                  customDisplay={
                    issueDetail?.parent_detail ? (
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded bg-custom-background-80 px-3 py-2 text-xs"
                        onClick={() => submitChanges({ parent: null })}
                      >
                        <span className="text-custom-text-200">Selected:</span>{" "}
                        {issueDetail.parent_detail?.name}
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    ) : (
                      <div className="inline-block rounded bg-custom-background-90 px-3 py-2 text-xs text-custom-text-200">
                        No parent selected
                      </div>
                    )
                  }
                  watch={watchIssue}
                  userAuth={memberRole}
                  disabled={uneditable}
                />
              )}
              {(fieldsToShow.includes("all") || fieldsToShow.includes("blocker")) && (
                <SidebarBlockerSelect
                  issueId={issueId as string}
                  submitChanges={submitChanges}
                  watch={watchIssue}
                  userAuth={memberRole}
                  disabled={uneditable}
                />
              )}
              {(fieldsToShow.includes("all") || fieldsToShow.includes("blocked")) && (
                <SidebarBlockedSelect
                  issueId={issueId as string}
                  submitChanges={submitChanges}
                  watch={watchIssue}
                  userAuth={memberRole}
                  disabled={uneditable}
                />
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
                          className="bg-custom-background-90"
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
                <SidebarCycleSelect
                  issueDetail={issueDetail}
                  handleCycleChange={handleCycleChange}
                  userAuth={memberRole}
                  disabled={uneditable}
                />
              )}
              {(fieldsToShow.includes("all") || fieldsToShow.includes("module")) && (
                <SidebarModuleSelect
                  issueDetail={issueDetail}
                  handleModuleChange={handleModuleChange}
                  userAuth={memberRole}
                  disabled={uneditable}
                />
              )}
            </div>
          )}
        </div>
        {(fieldsToShow.includes("all") || fieldsToShow.includes("label")) && (
          <div className={`space-y-3 py-3 ${uneditable ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex basis-1/2 items-center gap-x-2 text-sm text-custom-text-200">
                <TagIcon className="h-4 w-4" />
                <p>Label</p>
              </div>
              <div className="basis-1/2">
                <div className="flex flex-wrap gap-1">
                  {watchIssue("labels_list")?.map((labelId) => {
                    const label = issueLabels?.find((l) => l.id === labelId);

                    if (label)
                      return (
                        <span
                          key={label.id}
                          className="group flex cursor-pointer items-center gap-1 rounded-2xl border border-custom-border-100 px-1 py-0.5 text-xs hover:border-red-500/20 hover:bg-red-500/20"
                          onClick={() => {
                            const updatedLabels = watchIssue("labels_list")?.filter(
                              (l) => l !== labelId
                            );
                            submitChanges({
                              labels_list: updatedLabels,
                            });
                          }}
                        >
                          <span
                            className="h-2 w-2 flex-shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                label?.color && label.color !== "" ? label.color : "#000",
                            }}
                          />
                          {label.name}
                          <XMarkIcon className="h-2 w-2 group-hover:text-red-500" />
                        </span>
                      );
                  })}
                  <Controller
                    control={control}
                    name="labels_list"
                    render={({ field: { value } }) => (
                      <Listbox
                        as="div"
                        value={value}
                        onChange={(val: any) => submitChanges({ labels_list: val })}
                        className="flex-shrink-0"
                        multiple
                        disabled={isNotAllowed || uneditable}
                      >
                        {({ open }) => (
                          <div className="relative">
                            <Listbox.Button
                              className={`flex ${
                                isNotAllowed || uneditable
                                  ? "cursor-not-allowed"
                                  : "cursor-pointer hover:bg-custom-background-90"
                              } items-center gap-2 rounded-2xl border border-custom-border-100 px-2 py-0.5 text-xs text-custom-text-200`}
                            >
                              Select Label
                            </Listbox.Button>

                            <Transition
                              show={open}
                              as={React.Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-28 w-40 overflow-auto rounded-md bg-custom-background-80 py-1 text-xs shadow-lg border border-custom-border-100 focus:outline-none">
                                <div className="py-1">
                                  {issueLabels ? (
                                    issueLabels.length > 0 ? (
                                      issueLabels.map((label: IIssueLabels) => {
                                        const children = issueLabels?.filter(
                                          (l) => l.parent === label.id
                                        );

                                        if (children.length === 0) {
                                          if (!label.parent)
                                            return (
                                              <Listbox.Option
                                                key={label.id}
                                                className={({ active, selected }) =>
                                                  `${
                                                    active || selected
                                                      ? "bg-custom-background-90"
                                                      : ""
                                                  } ${
                                                    selected ? "" : "text-custom-text-200"
                                                  } flex cursor-pointer select-none items-center gap-2 truncate p-2`
                                                }
                                                value={label.id}
                                              >
                                                <span
                                                  className="h-2 w-2 flex-shrink-0 rounded-full"
                                                  style={{
                                                    backgroundColor:
                                                      label.color && label.color !== ""
                                                        ? label.color
                                                        : "#000",
                                                  }}
                                                />
                                                {label.name}
                                              </Listbox.Option>
                                            );
                                        } else
                                          return (
                                            <div className="border-y border-custom-border-100 bg-custom-background-90">
                                              <div className="flex select-none items-center gap-2 truncate p-2 font-medium text-custom-text-100">
                                                <RectangleGroupIcon className="h-3 w-3" />
                                                {label.name}
                                              </div>
                                              <div>
                                                {children.map((child) => (
                                                  <Listbox.Option
                                                    key={child.id}
                                                    className={({ active, selected }) =>
                                                      `${
                                                        active || selected
                                                          ? "bg-custom-background-100"
                                                          : ""
                                                      } ${
                                                        selected ? "" : "text-custom-text-200"
                                                      } flex cursor-pointer select-none items-center gap-2 truncate p-2`
                                                    }
                                                    value={child.id}
                                                  >
                                                    <span
                                                      className="h-2 w-2 flex-shrink-0 rounded-full"
                                                      style={{
                                                        backgroundColor: child?.color ?? "black",
                                                      }}
                                                    />
                                                    {child.name}
                                                  </Listbox.Option>
                                                ))}
                                              </div>
                                            </div>
                                          );
                                      })
                                    ) : (
                                      <div className="text-center">No labels found</div>
                                    )
                                  ) : (
                                    <Spinner />
                                  )}
                                </div>
                              </Listbox.Options>
                            </Transition>
                          </div>
                        )}
                      </Listbox>
                    )}
                  />
                  {!isNotAllowed && (
                    <button
                      type="button"
                      className={`flex ${
                        isNotAllowed || uneditable
                          ? "cursor-not-allowed"
                          : "cursor-pointer hover:bg-custom-background-90"
                      } items-center gap-1 rounded-2xl border border-custom-border-100 px-2 py-0.5 text-xs text-custom-text-200`}
                      onClick={() => setCreateLabelForm((prevData) => !prevData)}
                      disabled={uneditable}
                    >
                      {createLabelForm ? (
                        <>
                          <XMarkIcon className="h-3 w-3" /> Cancel
                        </>
                      ) : (
                        <>
                          <PlusIcon className="h-3 w-3" /> New
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
            {createLabelForm && (
              <form className="flex items-center gap-x-2" onSubmit={handleSubmit(handleNewLabel)}>
                <div>
                  <Popover className="relative">
                    {({ open }) => (
                      <>
                        <Popover.Button
                          className={`flex items-center gap-1 rounded-md bg-custom-background-80 p-1 outline-none focus:ring-2 focus:ring-custom-primary`}
                        >
                          {watch("color") && watch("color") !== "" && (
                            <span
                              className="h-5 w-5 rounded"
                              style={{
                                backgroundColor: watch("color") ?? "black",
                              }}
                            />
                          )}
                          <ChevronDownIcon className="h-3 w-3" />
                        </Popover.Button>

                        <Transition
                          as={React.Fragment}
                          enter="transition ease-out duration-200"
                          enterFrom="opacity-0 translate-y-1"
                          enterTo="opacity-100 translate-y-0"
                          leave="transition ease-in duration-150"
                          leaveFrom="opacity-100 translate-y-0"
                          leaveTo="opacity-0 translate-y-1"
                        >
                          <Popover.Panel className="absolute right-0 bottom-8 z-10 mt-1 max-w-xs transform px-2 sm:px-0">
                            <Controller
                              name="color"
                              control={controlLabel}
                              render={({ field: { value, onChange } }) => (
                                <TwitterPicker
                                  color={value}
                                  onChange={(value) => onChange(value.hex)}
                                />
                              )}
                            />
                          </Popover.Panel>
                        </Transition>
                      </>
                    )}
                  </Popover>
                </div>
                <Input
                  id="name"
                  name="name"
                  placeholder="Title"
                  register={register}
                  validations={{
                    required: "This is required",
                  }}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="grid place-items-center rounded bg-red-500 p-2.5"
                  onClick={() => setCreateLabelForm(false)}
                >
                  <XMarkIcon className="h-4 w-4 text-white" />
                </button>
                <button
                  type="submit"
                  className="grid place-items-center rounded bg-green-500 p-2.5"
                  disabled={isSubmitting}
                >
                  <PlusIcon className="h-4 w-4 text-white" />
                </button>
              </form>
            )}
          </div>
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
                  userAuth={memberRole}
                />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
