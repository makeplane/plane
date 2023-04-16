import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import estimatesService from "services/estimates.service";
// hooks
import useProjectDetails from "hooks/use-project-details";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// components
import { CreateUpdateEstimateModal, SingleEstimate } from "components/estimates";
//hooks
import useToast from "hooks/use-toast";
// ui
import { Loader, SecondaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import { IEstimate, IProject } from "types";
import type { NextPage } from "next";
// fetch-keys
import { ESTIMATES_LIST, PROJECT_DETAILS } from "constants/fetch-keys";
import projectService from "services/project.service";

const EstimatesSettings: NextPage = () => {
  const [estimateFormOpen, setEstimateFormOpen] = useState(false);

  const [estimateToUpdate, setEstimateToUpdate] = useState<IEstimate | undefined>();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const { projectDetails } = useProjectDetails();

  const { data: estimatesList } = useSWR<IEstimate[]>(
    workspaceSlug && projectId ? ESTIMATES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => estimatesService.getEstimatesList(workspaceSlug as string, projectId as string)
      : null
  );

  const editEstimate = (estimate: IEstimate) => {
    setEstimateToUpdate(estimate);
    setEstimateFormOpen(true);
  };

  const removeEstimate = (estimateId: string) => {
    if (!workspaceSlug || !projectId) return;

    mutate<IEstimate[]>(
      ESTIMATES_LIST(projectId as string),
      (prevData) => (prevData ?? []).filter((p) => p.id !== estimateId),
      false
    );

    estimatesService
      .deleteEstimate(workspaceSlug as string, projectId as string, estimateId)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Estimate Deleted successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Error: Estimate could not be deleted. Please try again",
        });
      });
  };

  const disableEstimates = () => {
    if (!workspaceSlug || !projectId) return;

    mutate<IProject>(
      PROJECT_DETAILS(projectId as string),
      (prevData) => {
        if (!prevData) return prevData;

        return { ...prevData, estimate: null };
      },
      false
    );

    projectService
      .updateProject(workspaceSlug as string, projectId as string, { estimate: null })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Estimate could not be disabled. Please try again",
        })
      );
  };

  return (
    <>
      <ProjectAuthorizationWrapper
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${projectDetails?.name ?? "Project"}`}
              link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
            />
            <BreadcrumbItem title="Estimates Settings" />
          </Breadcrumbs>
        }
      >
        <CreateUpdateEstimateModal
          isOpen={estimateFormOpen}
          data={estimateToUpdate}
          handleClose={() => {
            setEstimateFormOpen(false);
            setEstimateToUpdate(undefined);
          }}
        />
        <section className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold">Estimates</h3>
          <div className="col-span-12 space-y-5 sm:col-span-7">
            <div className="flex items-center gap-2">
              <span
                className="flex items-center cursor-pointer gap-2 text-theme"
                onClick={() => {
                  setEstimateToUpdate(undefined);
                  setEstimateFormOpen(true);
                }}
              >
                <PlusIcon className="h-4 w-4" />
                Create New Estimate
              </span>
              {projectDetails?.estimate && (
                <SecondaryButton onClick={disableEstimates}>Disable Estimates</SecondaryButton>
              )}
            </div>
          </div>
        </section>
        {estimatesList && estimatesList.length > 0 && (
          <section className="mt-4 divide-y px-6 mb-8 rounded-xl border bg-white">
            <>
              {estimatesList ? (
                estimatesList.map((estimate) => (
                  <SingleEstimate
                    key={estimate.id}
                    estimate={estimate}
                    editEstimate={(estimate) => editEstimate(estimate)}
                    handleEstimateDelete={(estimateId) => removeEstimate(estimateId)}
                  />
                ))
              ) : (
                <Loader className="space-y-5">
                  <Loader.Item height="40px" />
                  <Loader.Item height="40px" />
                  <Loader.Item height="40px" />
                  <Loader.Item height="40px" />
                </Loader>
              )}
            </>
          </section>
        )}
      </ProjectAuthorizationWrapper>
    </>
  );
};

export default EstimatesSettings;
