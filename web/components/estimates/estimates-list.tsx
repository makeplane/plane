import React, { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
// store hooks
import { useEstimate, useProject, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { CreateUpdateEstimateModal, DeleteEstimateModal, EstimateListItem } from "components/estimates";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// ui
import { Button, Loader } from "@plane/ui";
// types
import { IEstimate } from "@plane/types";
// helpers
import { orderArrayBy } from "helpers/array.helper";
// constants
import { PROJECT_SETTINGS_EMPTY_STATE_DETAILS } from "constants/empty-state";

export const EstimatesList: React.FC = observer(() => {
  // states
  const [estimateFormOpen, setEstimateFormOpen] = useState(false);
  const [estimateToDelete, setEstimateToDelete] = useState<string | null>(null);
  const [estimateToUpdate, setEstimateToUpdate] = useState<IEstimate | undefined>();
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const { updateProject, currentProjectDetails } = useProject();
  const { projectEstimates, getProjectEstimateById } = useEstimate();
  const { currentUser } = useUser();
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

  const emptyStateDetail = PROJECT_SETTINGS_EMPTY_STATE_DETAILS["estimate"];
  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const emptyStateImage = getEmptyStateImagePath("project-settings", "estimates", isLightMode);

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
            <EmptyState
              title={emptyStateDetail.title}
              description={emptyStateDetail.description}
              image={emptyStateImage}
              size="lg"
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
