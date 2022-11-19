// next
import Link from "next/link";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import Image from "next/image";
// react
import React, { useCallback, useEffect, useState } from "react";
// swr
import useSWR from "swr";
// react hook form
import { useForm } from "react-hook-form";
// headless ui
import { Tab } from "@headlessui/react";
// services
import issuesServices from "lib/services/issues.services";
// fetch keys
import { PROJECT_ISSUES_ACTIVITY, PROJECT_ISSUES_COMMENTS, STATE_LIST } from "constants/fetch-keys";
// hooks
import useUser from "lib/hooks/useUser";
// layouts
import ProjectLayout from "layouts/ProjectLayout";
// components
import CreateUpdateIssuesModal from "components/project/issues/CreateUpdateIssueModal";
import IssueCommentSection from "components/project/issues/comment/IssueCommentSection";
// common
import { timeAgo, debounce, addSpaceIfCamelCase } from "constants/common";
// components
import IssueDetailSidebar from "components/project/issues/issue-detail/IssueDetailSidebar";
// ui
import { Spinner, TextArea } from "ui";
// types
import { IIssue, IIssueComment, IssueResponse, IState } from "types";
import { BreadcrumbItem, Breadcrumbs } from "ui/Breadcrumbs";
import stateServices from "lib/services/state.services";

const IssueDetail: NextPage = () => {
  const router = useRouter();

  const { issueId, projectId } = router.query;

  const { activeWorkspace, activeProject, issues, mutateIssues } = useUser();

  const [isOpen, setIsOpen] = useState(false);

  const [issueDetail, setIssueDetail] = useState<IIssue | undefined>(undefined);

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    control,
  } = useForm<IIssue>({});

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

  return (
    <ProjectLayout>
      <CreateUpdateIssuesModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        projectId={projectId as string}
        data={isOpen ? issueDetail : undefined}
        isUpdatingSingleIssue
      />

      <div className="space-y-5">
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${activeProject?.name} Issues`}
            link={`/projects/${activeProject?.id}/issues`}
          />
          <BreadcrumbItem
            title={`Issue ${activeProject?.identifier}-${issueDetail?.sequence_id} Details`}
          />
        </Breadcrumbs>
        <div className="bg-gray-50 rounded-xl overflow-hidden">
          {issueDetail && activeProject ? (
            <>
              <div className="w-full py-4 px-10 bg-gray-200 flex justify-between items-center">
                <p className="text-gray-500">
                  <Link href={`/projects/${activeProject.id}/issues`}>{activeProject.name}</Link>/
                  {activeProject.identifier}-{issueDetail.sequence_id}
                </p>
                <div className="flex gap-x-2">
                  <button
                    type="button"
                    className={`px-4 py-1.5 bg-white rounded-lg ${
                      prevIssue ? "hover:bg-gray-100" : "bg-gray-100"
                    }`}
                    disabled={prevIssue ? false : true}
                    onClick={() => {
                      if (!prevIssue) return;
                      router.push(`/projects/${prevIssue.project}/issues/${prevIssue.id}`);
                    }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-1.5 bg-white rounded-lg ${
                      nextIssue ? "hover:bg-gray-100" : "bg-gray-100"
                    }`}
                    disabled={nextIssue ? false : true}
                    onClick={() => {
                      if (!nextIssue) return;
                      router.push(`/projects/${nextIssue.project}/issues/${nextIssue?.id}`);
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
              <div>
                <div className="flex flex-wrap">
                  <div className="w-full lg:w-3/4 h-full px-2 md:px-10 py-10 overflow-auto">
                    <div className="w-full h-full space-y-5">
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
                        className="text-3xl sm:text-3xl"
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
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-gray-50 px-2 text-sm text-gray-500">
                            Activity/Comments
                          </span>
                        </div>
                      </div>
                      <div className="w-full">
                        <Tab.Group>
                          <Tab.List className="flex gap-x-3">
                            {["Comments", "Activity"].map((item) => (
                              <Tab
                                key={item}
                                className={({ selected }) =>
                                  `px-3 py-1 text-sm rounded-md ${
                                    selected ? "bg-gray-800 text-white" : ""
                                  }`
                                }
                              >
                                {item}
                              </Tab>
                            ))}
                          </Tab.List>
                          <Tab.Panels className="mt-5">
                            <Tab.Panel>
                              <IssueCommentSection
                                comments={issueComments}
                                workspaceSlug={activeWorkspace?.slug as string}
                                projectId={projectId as string}
                                issueId={issueId as string}
                              />
                            </Tab.Panel>
                            <Tab.Panel>
                              {issueActivities ? (
                                <div className="space-y-3">
                                  {issueActivities.map((activity) => {
                                    if (activity.field !== "updated_by")
                                      return (
                                        <div
                                          key={activity.id}
                                          className="relative flex gap-x-2 w-full"
                                        >
                                          {/* <span
                                            className="absolute top-5 left-5 -ml-1 h-full w-0.5 bg-gray-200"
                                            aria-hidden="true"
                                          /> */}
                                          <div className="flex-shrink-0 -ml-1.5">
                                            {activity.actor_detail.avatar &&
                                            activity.actor_detail.avatar !== "" ? (
                                              <Image
                                                src={activity.actor_detail.avatar}
                                                alt={activity.actor_detail.name}
                                                height={30}
                                                width={30}
                                                className="rounded-full"
                                              />
                                            ) : (
                                              <div
                                                className={`h-8 w-8 bg-gray-500 text-white border-2 border-white grid place-items-center rounded-full`}
                                              >
                                                {activity.actor_detail.first_name.charAt(0)}
                                              </div>
                                            )}
                                          </div>
                                          <div className="w-full">
                                            <p>
                                              {activity.actor_detail.first_name}{" "}
                                              {activity.actor_detail.last_name}{" "}
                                              <span>{activity.verb}</span>{" "}
                                              {activity.verb !== "created" ? (
                                                <span>{activity.field ?? "commented"}</span>
                                              ) : (
                                                " this issue"
                                              )}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {timeAgo(activity.created_at)}
                                            </p>
                                            <div className="w-full mt-2">
                                              {activity.verb !== "created" && (
                                                <div className="text-sm">
                                                  <div>
                                                    From:{" "}
                                                    <span className="text-gray-500">
                                                      {activity.field === "state"
                                                        ? activity.old_value
                                                          ? addSpaceIfCamelCase(
                                                              states?.find(
                                                                (s) => s.id === activity.old_value
                                                              )?.name ?? ""
                                                            )
                                                          : "None"
                                                        : activity.old_value}
                                                    </span>
                                                  </div>
                                                  <div>
                                                    To:{" "}
                                                    <span className="text-gray-500">
                                                      {activity.field === "state"
                                                        ? activity.new_value
                                                          ? addSpaceIfCamelCase(
                                                              states?.find(
                                                                (s) => s.id === activity.new_value
                                                              )?.name ?? ""
                                                            )
                                                          : "None"
                                                        : activity.new_value}
                                                    </span>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                  })}
                                </div>
                              ) : (
                                <div className="w-full h-full flex justify-center items-center">
                                  <Spinner />
                                </div>
                              )}
                            </Tab.Panel>
                          </Tab.Panels>
                        </Tab.Group>
                      </div>
                    </div>
                  </div>
                  <div className="w-full lg:w-1/4 h-full border-l px-2 md:px-10 py-10">
                    <IssueDetailSidebar control={control} submitChanges={submitChanges} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Spinner />
            </div>
          )}
        </div>
      </div>
    </ProjectLayout>
  );
};

export default IssueDetail;
