import React, { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Plus } from "lucide-react";
// store hooks
import { useEstimate, useProject } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { CreateUpdateEstimateModal, DeleteEstimateModal, EstimateListItem } from "components/estimates";
// ui
import { Button, Loader } from "@plane/ui";
import { EmptyState } from "components/common";
// images
import emptyEstimate from "public/empty-state/estimate.svg";
// types
import { IEstimate } from "@plane/types";
// helpers
import { orderArrayBy } from "helpers/array.helper";

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
  // toast alert
  const { setToastAlert } = useToast();

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

      setToastAlert({
        type: "error",
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
          <div className="w-full py-8">
            <EmptyState
              title="No estimates yet"
              description="Estimates help you communicate the complexity of an issue."
              image={emptyEstimate}
              primaryButton={{
                icon: <Plus className="h-4 w-4" />,
                text: "Add Estimate",
                onClick: () => {
                  setEstimateFormOpen(true);
                  setEstimateToUpdate(undefined);
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
    </>
  );
});
