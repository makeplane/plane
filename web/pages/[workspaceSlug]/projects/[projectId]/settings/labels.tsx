import React, { useState, useRef } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// hooks
import useUserAuth from "hooks/use-user-auth";
// services
import { ProjectService } from "services/project";
import { IssueLabelService } from "services/issue";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// components
import {
  CreateUpdateLabelInline,
  DeleteLabelModal,
  LabelsListModal,
  SingleLabel,
  SingleLabelGroup,
} from "components/labels";
import { SettingsSidebar } from "components/project";
// ui
import { Button, Loader } from "@plane/ui";
import { EmptyState } from "components/common";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// images
import emptyLabel from "public/empty-state/label.svg";
// types
import { IIssueLabels } from "types";
import type { NextPage } from "next";
// fetch-keys
import { PROJECT_DETAILS, PROJECT_ISSUE_LABELS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";

// services
const projectService = new ProjectService();
const issueLabelService = new IssueLabelService();

const LabelsSettings: NextPage = () => {
  // create/edit label form
  const [labelForm, setLabelForm] = useState(false);

  // edit label
  const [isUpdating, setIsUpdating] = useState(false);
  const [labelToUpdate, setLabelToUpdate] = useState<IIssueLabels | null>(null);

  // labels list modal
  const [labelsListModal, setLabelsListModal] = useState(false);
  const [parentLabel, setParentLabel] = useState<IIssueLabels | undefined>(undefined);

  // delete label
  const [selectDeleteLabel, setSelectDeleteLabel] = useState<IIssueLabels | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUserAuth();

  const scrollToRef = useRef<HTMLDivElement>(null);

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId ? () => projectService.getProject(workspaceSlug as string, projectId as string) : null
  );

  const { data: issueLabels } = useSWR(
    workspaceSlug && projectId ? PROJECT_ISSUE_LABELS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => issueLabelService.getProjectIssueLabels(workspaceSlug as string, projectId as string)
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

  return (
    <>
      <LabelsListModal
        isOpen={labelsListModal}
        handleClose={() => setLabelsListModal(false)}
        parent={parentLabel}
        user={user}
      />
      <DeleteLabelModal
        isOpen={!!selectDeleteLabel}
        data={selectDeleteLabel ?? null}
        onClose={() => setSelectDeleteLabel(null)}
        user={user}
      />
      <ProjectAuthorizationWrapper
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${truncateText(projectDetails?.name ?? "Project", 32)}`}
              link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
              linkTruncate
            />
            <BreadcrumbItem title="Labels Settings" unshrinkTitle />
          </Breadcrumbs>
        }
      >
        <div className="flex flex-row gap-2 h-full">
          <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
            <SettingsSidebar />
          </div>
          <section className="pr-9 py-8 gap-10 w-full overflow-y-auto">
            <div className="flex items-center justify-between pt-2 pb-3.5 border-b border-custom-border-200">
              <h3 className="text-xl font-medium">Labels</h3>

              <Button variant="primary" onClick={newLabel} size="sm">
                Add label
              </Button>
            </div>
            <div className="space-y-3 py-6 h-full w-full">
              {labelForm && (
                <CreateUpdateLabelInline
                  labelForm={labelForm}
                  setLabelForm={setLabelForm}
                  isUpdating={isUpdating}
                  labelToUpdate={labelToUpdate}
                  onClose={() => {
                    setLabelForm(false);
                    setIsUpdating(false);
                    setLabelToUpdate(null);
                  }}
                  ref={scrollToRef}
                />
              )}
              <>
                {issueLabels ? (
                  issueLabels.length > 0 ? (
                    issueLabels.map((label) => {
                      const children = issueLabels?.filter((l) => l.parent === label.id);

                      if (children && children.length === 0) {
                        if (!label.parent)
                          return (
                            <SingleLabel
                              key={label.id}
                              label={label}
                              addLabelToGroup={() => addLabelToGroup(label)}
                              editLabel={(label) => {
                                editLabel(label);
                                scrollToRef.current?.scrollIntoView({
                                  behavior: "smooth",
                                });
                              }}
                              handleLabelDelete={() => setSelectDeleteLabel(label)}
                            />
                          );
                      } else
                        return (
                          <SingleLabelGroup
                            key={label.id}
                            label={label}
                            labelChildren={children}
                            addLabelToGroup={addLabelToGroup}
                            editLabel={(label) => {
                              editLabel(label);
                              scrollToRef.current?.scrollIntoView({
                                behavior: "smooth",
                              });
                            }}
                            handleLabelDelete={() => setSelectDeleteLabel(label)}
                            user={user}
                          />
                        );
                    })
                  ) : (
                    <EmptyState
                      title="No labels yet"
                      description="Create labels to help organize and filter issues in you project"
                      image={emptyLabel}
                      primaryButton={{
                        text: "Add label",
                        onClick: () => newLabel(),
                      }}
                      isFullScreen={false}
                    />
                  )
                ) : (
                  <Loader className="space-y-5">
                    <Loader.Item height="40px" />
                    <Loader.Item height="40px" />
                    <Loader.Item height="40px" />
                    <Loader.Item height="40px" />
                  </Loader>
                )}
              </>
            </div>
          </section>
        </div>
      </ProjectAuthorizationWrapper>
    </>
  );
};

export default LabelsSettings;
