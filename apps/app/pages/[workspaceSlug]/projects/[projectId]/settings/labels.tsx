import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectService from "services/project.service";
import issuesService from "services/issues.service";
// lib
import { requiredAdmin } from "lib/auth";
// layouts
import AppLayout from "layouts/app-layout";
// components
import {
  CreateUpdateLabelInline,
  LabelsListModal,
  SingleLabel,
  SingleLabelGroup,
} from "components/labels";
// ui
import { Button, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import { IIssueLabels, UserAuth } from "types";
import type { NextPageContext, NextPage } from "next";
// fetch-keys
import { PROJECT_DETAILS, PROJECT_ISSUE_LABELS } from "constants/fetch-keys";

const LabelsSettings: NextPage<UserAuth> = (props) => {
  const { isMember, isOwner, isViewer, isGuest } = props;

  // create/edit label form
  const [labelForm, setLabelForm] = useState(false);

  // edit label
  const [isUpdating, setIsUpdating] = useState(false);
  const [labelToUpdate, setLabelToUpdate] = useState<IIssueLabels | null>(null);

  // labels list modal
  const [labelsListModal, setLabelsListModal] = useState(false);
  const [parentLabel, setParentLabel] = useState<IIssueLabels | undefined>(undefined);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: issueLabels, mutate } = useSWR<IIssueLabels[]>(
    workspaceSlug && projectId ? PROJECT_ISSUE_LABELS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssueLabels(workspaceSlug as string, projectId as string)
      : null
  );

  const newLabel = () => {
    setIsUpdating(false);
    setLabelForm(true);
  };

  const addLabelToGroup = (parentLabel: IIssueLabels) => {
    setLabelsListModal(true);
    setParentLabel(parentLabel);
  };

  const editLabel = (label: IIssueLabels) => {
    setLabelForm(true);
    setIsUpdating(true);
    setLabelToUpdate(label);
  };

  const handleLabelDelete = (labelId: string) => {
    if (workspaceSlug && projectDetails) {
      mutate((prevData) => prevData?.filter((p) => p.id !== labelId), false);
      issuesService
        .deleteIssueLabel(workspaceSlug as string, projectDetails.id, labelId)
        .then((res) => {
          console.log(res);
        })
        .catch((e) => {
          console.log(e);
        });
    }
  };

  return (
    <>
      <LabelsListModal
        isOpen={labelsListModal}
        handleClose={() => setLabelsListModal(false)}
        parent={parentLabel}
      />
      <AppLayout
        settingsLayout="project"
        memberType={{ isMember, isOwner, isViewer, isGuest }}
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${projectDetails?.name ?? "Project"}`}
              link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
            />
            <BreadcrumbItem title="Labels Settings" />
          </Breadcrumbs>
        }
      >
        <section className="space-y-8">
          <div>
            <h3 className="text-3xl font-bold leading-6 text-gray-900">Labels</h3>
            <p className="mt-4 text-sm text-gray-500">Manage the labels of this project.</p>
          </div>
          <div className="flex items-center justify-between gap-2 md:w-2/3">
            <h4 className="text-md mb-1 leading-6 text-gray-900">Manage labels</h4>
            <Button theme="secondary" className="flex items-center gap-x-1" onClick={newLabel}>
              <PlusIcon className="h-4 w-4" />
              New label
            </Button>
          </div>
          <div className="space-y-5">
            <CreateUpdateLabelInline
              labelForm={labelForm}
              setLabelForm={setLabelForm}
              isUpdating={isUpdating}
              labelToUpdate={labelToUpdate}
            />
            <>
              {issueLabels ? (
                issueLabels.map((label) => {
                  const children = issueLabels?.filter((l) => l.parent === label.id);

                  if (children && children.length === 0) {
                    if (!label.parent)
                      return (
                        <SingleLabel
                          key={label.id}
                          label={label}
                          addLabelToGroup={() => addLabelToGroup(label)}
                          editLabel={editLabel}
                          handleLabelDelete={handleLabelDelete}
                        />
                      );
                  } else
                    return (
                      <SingleLabelGroup
                        key={label.id}
                        label={label}
                        labelChildren={children}
                        addLabelToGroup={addLabelToGroup}
                        editLabel={editLabel}
                        handleLabelDelete={handleLabelDelete}
                      />
                    );
                })
              ) : (
                <Loader className="space-y-5 md:w-2/3">
                  <Loader.Item height="40px" />
                  <Loader.Item height="40px" />
                  <Loader.Item height="40px" />
                  <Loader.Item height="40px" />
                </Loader>
              )}
            </>
          </div>
        </section>
      </AppLayout>
    </>
  );
};

export const getServerSideProps = async (ctx: NextPageContext) => {
  const projectId = ctx.query.projectId as string;
  const workspaceSlug = ctx.query.workspaceSlug as string;

  const memberDetail = await requiredAdmin(workspaceSlug, projectId, ctx.req?.headers.cookie);

  return {
    props: {
      isOwner: memberDetail?.role === 20,
      isMember: memberDetail?.role === 15,
      isViewer: memberDetail?.role === 10,
      isGuest: memberDetail?.role === 5,
    },
  };
};

export default LabelsSettings;
