import { FC, useState } from "react";
import useSWR from "swr";
import { IEstimate } from "@plane/types";
import { Button, Loader, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { EmptyState } from "@/components/empty-state";
import { CreateEstimateModal, EstimateEmptyScreen } from "@/components/estimates";
import { DeleteEstimateModal, EstimateListItem } from "@/components/estimates-legacy";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// ee components
// hooks
import { useProject, useProjectEstimates } from "@/hooks/store";

type TEstimateRoot = {
  workspaceSlug: string;
  projectId: string;
};

export const EstimateRoot: FC<TEstimateRoot> = (props) => {
  const { workspaceSlug, projectId } = props;
  // hooks
  const { updateProject, currentProjectDetails } = useProject();
  const { loader, projectEstimateIds, estimateById, getAllEstimates } = useProjectEstimates(projectId);
  // states
  const [isEstimateCreateModalOpen, setIsEstimateCreateModalOpen] = useState(false);
  const [isEstimateDeleteModalOpen, setIsEstimateDeleteModalOpen] = useState<string | null>(null);
  const [estimateToUpdate, setEstimateToUpdate] = useState<IEstimate | undefined>();

  console.log("workspaceSlug", workspaceSlug);
  console.log("projectId", projectId);

  const { isLoading: isSWRLoading } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ESTIMATES_${workspaceSlug}_${projectId}` : null,
    async () => workspaceSlug && projectId && getAllEstimates()
  );

  const editEstimate = (estimate: IEstimate) => {
    setIsEstimateCreateModalOpen(true);
    console.log("estimate", estimate);
    // Order the points array by key before updating the estimate to update state
    // setEstimateToUpdate({
    //   ...estimate,
    //   points: orderArrayBy(estimate.points, "key"),
    // });
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
    <div>
      <EstimateEmptyScreen onButtonClick={() => {}} />
      {loader === "init-loader" || isSWRLoading ? (
        <Loader className="mt-5 space-y-5">
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
        </Loader>
      ) : (
        <>
          {/* header section */}
          <section className="flex items-center justify-between border-b border-custom-border-100 py-3.5">
            <h3 className="text-xl font-medium">Estimates</h3>
            <div className="col-span-12 space-y-5 sm:col-span-7">
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsEstimateCreateModalOpen(true);
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

          {/* listing of estimates */}
          {!projectEstimateIds || (projectEstimateIds && projectEstimateIds.length <= 0) ? (
            <div className="h-full w-full py-8">
              <EmptyState type={EmptyStateType.PROJECT_SETTINGS_ESTIMATE} />
            </div>
          ) : (
            <section className="h-full overflow-y-auto bg-custom-background-100">
              {projectEstimateIds &&
                projectEstimateIds.map((estimateId: string) => {
                  const estimate = estimateById(estimateId);
                  if (!estimate) return <></>;
                  return (
                    <EstimateListItem
                      key={estimateId}
                      estimate={estimate}
                      editEstimate={(estimate) => editEstimate(estimate)}
                      deleteEstimate={(estimateId) => setIsEstimateDeleteModalOpen(estimateId)}
                    />
                  );
                })}
            </section>
          )}
        </>
      )}

      <CreateEstimateModal
        isOpen={isEstimateCreateModalOpen}
        data={estimateToUpdate}
        handleClose={() => {
          setIsEstimateCreateModalOpen(false);
          setEstimateToUpdate(undefined);
        }}
      />
      <DeleteEstimateModal
        isOpen={!!isEstimateDeleteModalOpen}
        handleClose={() => setIsEstimateDeleteModalOpen(null)}
        data={
          null
          // getProjectEstimateById(isEstimateDeleteModalOpen!)
        }
      />
    </div>
  );
};
