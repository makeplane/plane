import React, { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { IEstimate } from "@plane/types";
// store hooks
import { Button, Loader, TOAST_TYPE, setToast } from "@plane/ui";
import { EmptyState } from "@/components/empty-state";
import { CreateUpdateEstimateModal, DeleteEstimateModal, EstimateListItem } from "@/components/estimates";
import { EmptyStateType } from "@/constants/empty-state";
import { orderArrayBy } from "@/helpers/array.helper";
import { useEstimate, useProject } from "@/hooks/store";
// components
// ui
// types
// helpers
// constants

export const EstimatesList: React.FC = observer(() => {
  // states
  const [estimateFormOpen, setEstimateFormOpen] = useState(false);
  const [estimateToDelete, setEstimateToDelete] = useState<string | null>(null);
  const [estimateToUpdate, setEstimateToUpdate] = useState<IEstimate | undefined>();
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { updateProject, currentProjectDetails } = useProject();
  const { projectEstimates, getProjectEstimateById } = useEstimate();

  const editEstimate = (estimate: IEstimate) => {
    setEstimateFormOpen(true);
    // Order the points array by key before updating the estimate to update state
    setEstimateToUpdate({
      ...estimate,
      points: orderArrayBy(estimate.points, "key"),
    });
  };

  const disableEstimates = () => {
    if (!workspaceSlug || !projectId) return;

    updateProject(workspaceSlug.toString(), projectId.toString(), { estimate: null }).catch((err) => {
      const error = err?.error;
      const errorString = Array.isArray(error) ? error[0] : error;

      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: errorString ?? "Estimate could not be disabled. Please try again",
      });
    });
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
      />

      <DeleteEstimateModal
        isOpen={!!estimateToDelete}
        handleClose={() => setEstimateToDelete(null)}
        data={getProjectEstimateById(estimateToDelete!)}
      />

      <section className="flex items-center justify-between border-b border-custom-border-100 py-3.5">
        <h3 className="text-xl font-medium">Estimates</h3>
        <div className="col-span-12 space-y-5 sm:col-span-7">
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => {
                setEstimateFormOpen(true);
                setEstimateToUpdate(undefined);
              }}
              size="sm"
            >
              Add Estimate
            </Button>
            {currentProjectDetails?.estimate && (
              <Button variant="neutral-primary" onClick={disableEstimates} size="sm">
                Disable Estimates
              </Button>
            )}
          </div>
        </div>
      </section>

      {projectEstimates ? (
        projectEstimates.length > 0 ? (
          <section className="h-full overflow-y-auto bg-custom-background-100">
            {projectEstimates.map((estimate) => (
              <EstimateListItem
                key={estimate.id}
                estimate={estimate}
                editEstimate={(estimate) => editEstimate(estimate)}
                deleteEstimate={(estimateId) => setEstimateToDelete(estimateId)}
              />
            ))}
          </section>
        ) : (
          <div className="h-full w-full py-8">
            <EmptyState type={EmptyStateType.PROJECT_SETTINGS_ESTIMATE} />
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
    </>
  );
});
