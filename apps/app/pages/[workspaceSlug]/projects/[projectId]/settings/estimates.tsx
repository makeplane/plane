import React, { useState, useRef } from "react";

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
import { Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import { IEstimate } from "types";
import type { NextPage } from "next";
// fetch-keys
import { ESTIMATES_LIST } from "constants/fetch-keys";

const EstimatesSettings: NextPage = () => {
  const [estimateFormOpen, setEstimateFormOpen] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [estimateToUpdate, setEstimateToUpdate] = useState<IEstimate | undefined>();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const { projectDetails } = useProjectDetails();

  const scrollToRef = useRef<HTMLDivElement>(null);

  const { data: estimatesList } = useSWR<IEstimate[]>(
    workspaceSlug && projectId ? ESTIMATES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => estimatesService.getEstimatesList(workspaceSlug as string, projectId as string)
      : null
  );

  const editEstimate = (estimate: IEstimate) => {
    setIsUpdating(true);
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
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Error: Estimate could not be deleted. Please try again",
        });
      });
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
          isCreate={estimateToUpdate ? true : false}
          isOpen={estimateFormOpen}
          data={estimateToUpdate}
          handleClose={() => {
            setEstimateFormOpen(false);
            setEstimateToUpdate(undefined);
          }}
        />
        <section className="grid grid-cols-12 gap-10">
          <div className="col-span-12 sm:col-span-5">
            <h3 className="text-[28px] font-semibold">Estimates</h3>
          </div>
          <div className="col-span-12 space-y-5 sm:col-span-7">
            <div className="flex sm:justify-end sm:items-end sm:h-full text-theme">
              <span
                className="flex items-center cursor-pointer gap-2"
                onClick={() => {
                  setEstimateToUpdate(undefined);
                  setEstimateFormOpen(true);
                }}
              >
                <PlusIcon className="h-4 w-4" />
                Create New Estimate
              </span>
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
