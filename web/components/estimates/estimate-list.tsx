import React, { useState } from "react";
import { useRouter } from "next/router";

// store
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CreateUpdateEstimateModal, DeleteEstimateModal, EstimateListItem } from "components/estimates";
//hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Loader } from "@plane/ui";
import { EmptyState } from "components/common";
// icons
import { Plus } from "lucide-react";
// images
import emptyEstimate from "public/empty-state/estimate.svg";
// types
import { IEstimate } from "types";

export const EstimatesList: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // store
  const { project: projectStore } = useMobxStore();

  // states
  const [estimateFormOpen, setEstimateFormOpen] = useState(false);
  const [estimateToDelete, setEstimateToDelete] = useState<string | null>(null);
  const [estimateToUpdate, setEstimateToUpdate] = useState<IEstimate | undefined>();

  // hooks
  const { setToastAlert } = useToast();

  // derived values
  const estimatesList = projectStore.projectEstimates;
  const projectDetails = projectStore.project_details?.[projectId?.toString()!];

  const editEstimate = (estimate: IEstimate) => {
    setEstimateFormOpen(true);
    setEstimateToUpdate(estimate);
  };

  const disableEstimates = () => {
    if (!workspaceSlug || !projectId) return;

    projectStore.updateProject(workspaceSlug.toString(), projectId.toString(), { estimate: null }).catch((err) => {
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
        data={projectStore.getProjectEstimateById(estimateToDelete!)}
      />

      <section className="flex items-center justify-between py-3.5 border-b border-custom-border-200">
        <h3 className="text-xl font-medium">Estimates</h3>
        <div className="col-span-12 space-y-5 sm:col-span-7">
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => {
                setEstimateFormOpen(true);
                setEstimateToUpdate(undefined);
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
              <EstimateListItem
                key={estimate.id}
                estimate={estimate}
                editEstimate={(estimate) => editEstimate(estimate)}
                deleteEstimate={(estimateId) => setEstimateToDelete(estimateId)}
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
