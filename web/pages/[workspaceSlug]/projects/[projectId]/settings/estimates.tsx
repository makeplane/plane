import React, { useState } from "react";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";
// services
import { ProjectService, ProjectEstimateService } from "services/project";
// hooks
import useProjectDetails from "hooks/use-project-details";
// layouts
import { ProjectSettingLayout } from "layouts/setting-layout/project-setting-layout";
// components
import { CreateUpdateEstimateModal, SingleEstimate } from "components/estimates";
import { ProjectSettingHeader } from "components/headers";
//hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// ui
import { Button, Loader } from "@plane/ui";
import { EmptyState } from "components/common";
// icons
import { Plus } from "lucide-react";
// images
import emptyEstimate from "public/empty-state/estimate.svg";
// types
import { IEstimate, IProject } from "types";
import type { NextPage } from "next";
// fetch-keys
import { ESTIMATES_LIST, PROJECT_DETAILS } from "constants/fetch-keys";

// services
const projectService = new ProjectService();
const projectEstimateService = new ProjectEstimateService();

const EstimatesSettings: NextPage = () => {
  const [estimateFormOpen, setEstimateFormOpen] = useState(false);

  const [estimateToUpdate, setEstimateToUpdate] = useState<IEstimate | undefined>();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUserAuth();

  const { setToastAlert } = useToast();

  const { projectDetails } = useProjectDetails();

  const { data: estimatesList } = useSWR<IEstimate[]>(
    workspaceSlug && projectId ? ESTIMATES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectEstimateService.getEstimatesList(workspaceSlug as string, projectId as string)
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

    projectEstimateService.deleteEstimate(workspaceSlug as string, projectId as string, estimateId, user).catch(() => {
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

    projectService.updateProject(workspaceSlug as string, projectId as string, { estimate: null }, user).catch(() =>
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Estimate could not be disabled. Please try again",
      })
    );
  };

  return (
    <>
      <CreateUpdateEstimateModal
        isOpen={estimateFormOpen}
        data={estimateToUpdate}
        handleClose={() => {
          setEstimateFormOpen(false);
          setEstimateToUpdate(undefined);
        }}
        user={user}
      />

      <ProjectSettingLayout header={<ProjectSettingHeader title="Estimates Settings" />}>
        <div className="pr-9 py-8 w-full overflow-y-auto">
          <section className="flex items-center justify-between py-3.5 border-b border-custom-border-200">
            <h3 className="text-xl font-medium">Estimates</h3>
            <div className="col-span-12 space-y-5 sm:col-span-7">
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    setEstimateToUpdate(undefined);
                    setEstimateFormOpen(true);
                  }}
                >
                  Add Estimate
                </Button>
                {projectDetails?.estimate && (
                  <Button variant="neutral-primary" onClick={disableEstimates}>
                    Disable Estimates
                  </Button>
                )}
              </div>
            </div>
          </section>
          {estimatesList ? (
            estimatesList.length > 0 ? (
              <section className="h-full bg-custom-background-100 overflow-y-auto">
                {estimatesList.map((estimate) => (
                  <SingleEstimate
                    key={estimate.id}
                    estimate={estimate}
                    editEstimate={(estimate) => editEstimate(estimate)}
                    handleEstimateDelete={(estimateId) => removeEstimate(estimateId)}
                    user={user}
                  />
                ))}
              </section>
            ) : (
              <div className="h-full w-full overflow-y-auto">
                <EmptyState
                  title="No estimates yet"
                  description="Estimates help you communicate the complexity of an issue."
                  image={emptyEstimate}
                  primaryButton={{
                    icon: <Plus className="h-4 w-4" />,
                    text: "Add Estimate",
                    onClick: () => {
                      setEstimateToUpdate(undefined);
                      setEstimateFormOpen(true);
                    },
                  }}
                />
              </div>
            )
          ) : (
            <Loader className="mt-5 space-y-5">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          )}
        </div>
      </ProjectSettingLayout>
    </>
  );
};

export default EstimatesSettings;
