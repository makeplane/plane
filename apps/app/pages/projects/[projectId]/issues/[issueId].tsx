// next
import type { NextPage } from "next";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
// react
import React, { useCallback, useEffect, useState } from "react";
// swr
import useSWR, { mutate } from "swr";
// react hook form
import { useForm, Controller } from "react-hook-form";
// headless ui
import { Disclosure, Menu, Tab, Transition } from "@headlessui/react";
// services
import issuesServices from "lib/services/issues.services";
import stateServices from "lib/services/state.services";
// fetch keys
import {
  PROJECT_ISSUES_ACTIVITY,
  PROJECT_ISSUES_COMMENTS,
  PROJECT_ISSUES_DETAILS,
  PROJECT_ISSUES_LIST,
  STATE_LIST,
} from "constants/fetch-keys";
// hooks
import useUser from "lib/hooks/useUser";
// layouts
import AdminLayout from "layouts/AdminLayout";
// components
import CreateUpdateIssuesModal from "components/project/issues/CreateUpdateIssueModal";
import IssueCommentSection from "components/project/issues/issue-detail/comment/IssueCommentSection";
// common
import { debounce } from "constants/common";
// components
import IssueDetailSidebar from "components/project/issues/issue-detail/IssueDetailSidebar";
// activites
import IssueActivitySection from "components/project/issues/issue-detail/activity";
// ui
import { Spinner, TextArea } from "ui";
import HeaderButton from "ui/HeaderButton";
import { BreadcrumbItem, Breadcrumbs } from "ui/Breadcrumbs";
// types
import { IIssue, IIssueComment, IssueResponse, IState } from "types";
// icons
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import AddAsSubIssue from "components/command-palette/addAsSubIssue";

const IssueDetail: NextPage = () => {
  const router = useRouter();

  const { issueId, projectId } = router.query;

  const { activeWorkspace, activeProject, issues, mutateIssues } = useUser();

  const [isOpen, setIsOpen] = useState(false);
  const [isAddAsSubIssueOpen, setIsAddAsSubIssueOpen] = useState(false);

  const [issueDetail, setIssueDetail] = useState<IIssue | undefined>(undefined);

  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
  >(undefined);

  const [issueDescriptionValue, setIssueDescriptionValue] = useState("");
  const handleDescriptionChange: any = (value: any) => {
    console.log(value);
    setIssueDescriptionValue(value);
  };

  const RichTextEditor = dynamic(() => import("components/lexical/editor"), {
    ssr: false,
  });

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    control,
  } = useForm<IIssue>({
    defaultValues: {
      name: "",
      description: "",
      state: "",
      assignees_list: [],
      priority: "low",
      blockers_list: [],
      blocked_list: [],
      target_date: new Date().toString(),
      cycle: "",
    },
  });

  const { data: issueActivities } = useSWR<any[]>(
    activeWorkspace && projectId && issueId ? PROJECT_ISSUES_ACTIVITY : null,
    activeWorkspace && projectId && issueId
      ? () =>
          issuesServices.getIssueActivities(
            activeWorkspace.slug,
            projectId as string,
            issueId as string
          )
      : null
  );

  const { data: issueComments } = useSWR<IIssueComment[]>(
    activeWorkspace && projectId && issueId ? PROJECT_ISSUES_COMMENTS : null,
    activeWorkspace && projectId && issueId
      ? () =>
          issuesServices.getIssueComments(
            activeWorkspace.slug,
            projectId as string,
            issueId as string
          )
      : null
  );

  const { data: states } = useSWR<IState[]>(
    activeWorkspace && activeProject ? STATE_LIST(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => stateServices.getStates(activeWorkspace.slug, activeProject.id)
      : null
  );

  const submitChanges = useCallback(
    (formData: Partial<IIssue>) => {
      if (!activeWorkspace || !activeProject || !issueId) return;
      mutateIssues(
        (prevData) => ({
          ...(prevData as IssueResponse),
          results: (prevData?.results ?? []).map((issue) => {
            if (issue.id === issueId) {
              return { ...issue, ...formData };
            }
            return issue;
          }),
        }),
        false
      );
      issuesServices
        .patchIssue(activeWorkspace.slug, projectId as string, issueId as string, formData)
        .then((response) => {
          console.log(response);
        })
        .catch((error) => {
          console.log(error);
        });
    },
    [activeProject, activeWorkspace, issueId, projectId, mutateIssues]
  );

  useEffect(() => {
    if (issueDetail)
      reset({
        ...issueDetail,
        blockers_list:
          issueDetail.blockers_list ??
          issueDetail.blocker_issues?.map((issue) => issue.blocker_issue_detail?.id),
        blocked_list:
          issueDetail.blocked_list ??
          issueDetail.blocked_issues?.map((issue) => issue.blocked_issue_detail?.id),
        assignees_list:
          issueDetail.assignees_list ?? issueDetail.assignee_details?.map((user) => user.id),
        labels_list: issueDetail.labels_list ?? issueDetail.labels?.map((label) => label),
      });
  }, [issueDetail, reset]);

  useEffect(() => {
    const issueIndex = issues?.results.findIndex((issue) => issue.id === issueId);
    if (issueIndex === undefined) return;
    const issueDetail = issues?.results[issueIndex];
    setIssueDetail(issueDetail);
  }, [issues, issueId]);

  const prevIssue = issues?.results[issues?.results.findIndex((issue) => issue.id === issueId) - 1];
  const nextIssue = issues?.results[issues?.results.findIndex((issue) => issue.id === issueId) + 1];

  const subIssues = (issues && issues.results.filter((i) => i.parent === issueDetail?.id)) ?? [];

  const handleRemove = (issueId: string) => {
    if (activeWorkspace && activeProject) {
      issuesServices
        .patchIssue(activeWorkspace.slug, activeProject.id, issueId, { parent: null })
        .then((res) => {
          mutate<IssueResponse>(
            PROJECT_ISSUES_LIST(activeWorkspace.slug, activeProject.id),
            (prevData) => ({
              ...(prevData as IssueResponse),
              results: (prevData?.results ?? []).map((p) =>
                p.id === issueId ? { ...p, ...res } : p
              ),
            }),
            false
          );
        })
        .catch((e) => {
          console.log(e);
        });
    }
  };

  return (
    <AdminLayout>
      <CreateUpdateIssuesModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        projectId={projectId as string}
        prePopulateData={{
          ...preloadedData,
        }}
      />
      <AddAsSubIssue
        isOpen={isAddAsSubIssueOpen}
        setIsOpen={setIsAddAsSubIssueOpen}
        parentId={issueDetail?.id ?? ""}
      />

      <div className="flex items-center justify-between w-full mb-5">
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${activeProject?.name ?? "Project"} Issues`}
            link={`/projects/${activeProject?.id}/issues`}
          />
          <BreadcrumbItem
            title={`Issue ${activeProject?.identifier ?? "Project"}-${
              issueDetail?.sequence_id ?? "..."
            } Details`}
          />
        </Breadcrumbs>
        <div className="flex items-center gap-x-3">
          <HeaderButton
            Icon={ChevronLeftIcon}
            label="Previous"
            className={`${!prevIssue ? "cursor-not-allowed opacity-70" : ""}`}
            onClick={() => {
              if (!prevIssue) return;
              router.push(`/projects/${prevIssue.project}/issues/${prevIssue.id}`);
            }}
          />
          <HeaderButton
            Icon={ChevronRightIcon}
            disabled={!nextIssue}
            label="Next"
            className={`${!nextIssue ? "cursor-not-allowed opacity-70" : ""}`}
            onClick={() => {
              if (!nextIssue) return;
              router.push(`/projects/${nextIssue.project}/issues/${nextIssue?.id}`);
            }}
            position="reverse"
          />
        </div>
      </div>
      {issueDetail && activeProject ? (
        <div className="grid grid-cols-4 gap-5">
          <div className="col-span-3 space-y-5">
            <div className="bg-secondary rounded-lg p-4">
              {/* <Controller
                control={control}
                name="description"
                render={({ field: { value, onChange } }) => (
                  <RichTextEditor
                    onChange={(state: string) => {
                      handleDescriptionChange(state);
                      onChange(issueDescriptionValue);
                    }}
                    value={issueDescriptionValue}
                    id="editor"
                  />
                )}
              /> */}
              <div>
                <TextArea
                  id="name"
                  placeholder="Enter issue name"
                  name="name"
                  autoComplete="off"
                  validations={{ required: true }}
                  register={register}
                  onChange={debounce(() => {
                    handleSubmit(submitChanges)();
                  }, 5000)}
                  mode="transparent"
                  className="text-xl font-medium"
                />
                <TextArea
                  id="description"
                  name="description"
                  error={errors.description}
                  validations={{
                    required: true,
                  }}
                  onChange={debounce(() => {
                    handleSubmit(submitChanges)();
                  }, 5000)}
                  placeholder="Enter issue description"
                  mode="transparent"
                  register={register}
                />
              </div>
              <div className="mt-2">
                {subIssues && subIssues.length > 0 ? (
                  <Disclosure>
                    {({ open }) => (
                      <>
                        <div className="flex justify-between items-center">
                          <Disclosure.Button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-xs font-medium">
                            <ChevronRightIcon className={`h-3 w-3 ${open ? "rotate-90" : ""}`} />
                            Sub-issues{" "}
                            <span className="text-gray-600 ml-1">{subIssues.length}</span>
                          </Disclosure.Button>
                          {open ? (
                            <div className="flex items-center">
                              <button
                                type="button"
                                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-xs font-medium"
                                onClick={() => {
                                  setIsOpen(true);
                                  setPreloadedData({
                                    parent: issueDetail.id,
                                    actionType: "createIssue",
                                  });
                                }}
                              >
                                <PlusIcon className="h-3 w-3" />
                                Add new
                              </button>

                              <Menu as="div" className="relative inline-block">
                                <Menu.Button className="grid relative place-items-center rounded p-1 hover:bg-gray-100 focus:outline-none">
                                  <EllipsisHorizontalIcon className="h-4 w-4" />
                                </Menu.Button>

                                <Transition
                                  as={React.Fragment}
                                  enter="transition ease-out duration-100"
                                  enterFrom="transform opacity-0 scale-95"
                                  enterTo="transform opacity-100 scale-100"
                                  leave="transition ease-in duration-75"
                                  leaveFrom="transform opacity-100 scale-100"
                                  leaveTo="transform opacity-0 scale-95"
                                >
                                  <Menu.Items className="origin-top-right absolute right-0 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                    <div className="p-1">
                                      <Menu.Item as="div">
                                        {(active) => (
                                          <button
                                            className="flex items-center gap-2 p-2 text-left text-gray-900 hover:bg-theme hover:text-white rounded-md text-xs whitespace-nowrap"
                                            onClick={() => setIsAddAsSubIssueOpen(true)}
                                          >
                                            Add an existing issue
                                          </button>
                                        )}
                                      </Menu.Item>
                                    </div>
                                  </Menu.Items>
                                </Transition>
                              </Menu>
                            </div>
                          ) : null}
                        </div>
                        <Transition
                          enter="transition duration-100 ease-out"
                          enterFrom="transform scale-95 opacity-0"
                          enterTo="transform scale-100 opacity-100"
                          leave="transition duration-75 ease-out"
                          leaveFrom="transform scale-100 opacity-100"
                          leaveTo="transform scale-95 opacity-0"
                        >
                          <Disclosure.Panel className="flex flex-col gap-y-1 mt-3">
                            {subIssues.map((subIssue) => (
                              <Link
                                key={subIssue.id}
                                href={`/projects/${activeProject.id}/issues/${subIssue.id}`}
                              >
                                <a className="p-2 flex justify-between items-center rounded text-xs hover:bg-gray-100">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`h-1.5 w-1.5 block rounded-full`}
                                      style={{
                                        backgroundColor: subIssue.state_detail.color,
                                      }}
                                    />
                                    <span className="text-gray-600">
                                      {activeProject.identifier}-{subIssue.sequence_id}
                                    </span>
                                    <span className="font-medium">{subIssue.name}</span>
                                  </div>
                                  <div>
                                    <Menu as="div" className="relative inline-block">
                                      <Menu.Button className="grid relative place-items-center focus:outline-none">
                                        <EllipsisHorizontalIcon className="h-4 w-4" />
                                      </Menu.Button>

                                      <Transition
                                        as={React.Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="transform opacity-0 scale-95"
                                        enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="transform opacity-100 scale-100"
                                        leaveTo="transform opacity-0 scale-95"
                                      >
                                        <Menu.Items className="origin-top-right absolute right-0 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                          <div className="p-1">
                                            <Menu.Item as="div">
                                              {(active) => (
                                                <button
                                                  className="flex items-center gap-2 p-2 text-left text-gray-900 hover:bg-theme hover:text-white rounded-md text-xs whitespace-nowrap"
                                                  onClick={() => handleRemove(subIssue.id)}
                                                >
                                                  Remove as sub-issue
                                                </button>
                                              )}
                                            </Menu.Item>
                                          </div>
                                        </Menu.Items>
                                      </Transition>
                                    </Menu>
                                  </div>
                                </a>
                              </Link>
                            ))}
                          </Disclosure.Panel>
                        </Transition>
                      </>
                    )}
                  </Disclosure>
                ) : (
                  <Menu as="div" className="relative inline-block">
                    <Menu.Button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-xs font-medium">
                      <PlusIcon className="h-3 w-3" />
                      Add sub-issue
                    </Menu.Button>

                    <Transition
                      as={React.Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="origin-top-right absolute left-0 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                        <div className="p-1">
                          <Menu.Item as="div">
                            {(active) => (
                              <button
                                type="button"
                                className="text-left p-2 text-gray-900 hover:bg-theme hover:text-white rounded-md text-xs whitespace-nowrap w-full"
                                onClick={() => {
                                  setIsOpen(true);
                                  setPreloadedData({
                                    parent: issueDetail.id,
                                    actionType: "createIssue",
                                  });
                                }}
                              >
                                Add new
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item as="div">
                            {(active) => (
                              <button
                                type="button"
                                className="p-2 text-left text-gray-900 hover:bg-theme hover:text-white rounded-md text-xs whitespace-nowrap"
                                onClick={() => {
                                  setIsAddAsSubIssueOpen(true);
                                  setPreloadedData({
                                    parent: issueDetail.id,
                                    actionType: "createIssue",
                                  });
                                }}
                              >
                                Add an existing issue
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                )}
              </div>
            </div>
            <div className="bg-secondary rounded-lg p-4 space-y-5">
              <Tab.Group>
                <Tab.List className="flex gap-x-3">
                  {["Comments", "Activity"].map((item) => (
                    <Tab
                      key={item}
                      className={({ selected }) =>
                        `px-3 py-1 text-sm rounded-md border-2 border-gray-700 ${
                          selected ? "bg-gray-700 text-white" : ""
                        }`
                      }
                    >
                      {item}
                    </Tab>
                  ))}
                </Tab.List>
                <Tab.Panels>
                  <Tab.Panel>
                    <IssueCommentSection
                      comments={issueComments}
                      workspaceSlug={activeWorkspace?.slug as string}
                      projectId={projectId as string}
                      issueId={issueId as string}
                    />
                  </Tab.Panel>
                  <Tab.Panel>
                    <IssueActivitySection issueActivities={issueActivities} states={states} />
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>
          </div>
          <div className="sticky top-0 h-min bg-secondary p-4 rounded-lg">
            <IssueDetailSidebar
              control={control}
              issueDetail={issueDetail}
              submitChanges={submitChanges}
            />
          </div>
        </div>
      ) : (
        <div className="h-full w-full grid place-items-center px-4 sm:px-0">
          <Spinner />
        </div>
      )}
    </AdminLayout>
  );
};

export default IssueDetail;
