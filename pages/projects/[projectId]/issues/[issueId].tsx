// next
import type { NextPage } from "next";
import { useRouter } from "next/router";
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
import stateServices from "lib/services/state.services";
// fetch keys
import { PROJECT_ISSUES_ACTIVITY, PROJECT_ISSUES_COMMENTS, STATE_LIST } from "constants/fetch-keys";
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
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

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
    <AdminLayout>
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
            title={`${activeProject?.name ?? "Project"} Issues`}
            link={`/projects/${activeProject?.id}/issues`}
          />
          <BreadcrumbItem
            title={`Issue ${activeProject?.identifier ?? "Project"}-${
              issueDetail?.sequence_id ?? "..."
            } Details`}
          />
        </Breadcrumbs>
        <div className="flex items-center justify-between w-full">
          <h2 className="text-lg font-medium">{`${activeProject?.name ?? "Project"}/${
            activeProject?.identifier ?? "..."
          }-${issueDetail?.sequence_id ?? "..."}`}</h2>
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
              <div className="bg-secondary rounded-lg p-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-2 text-sm text-gray-500">Activity/Comments</span>
                  </div>
                </div>
                <div className="w-full space-y-5 mt-3">
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
      </div>
    </AdminLayout>
  );
};

export default IssueDetail;
