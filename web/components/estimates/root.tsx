import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { IEstimate } from "@plane/types";
// components
import {
  EstimateLoaderScreen,
  EstimateEmptyScreen,
  EstimateDisableSwitch,
  CreateEstimateModal,
  EstimateList,
} from "@/components/estimates";
// hooks
import { useProjectEstimates } from "@/hooks/store";

type TEstimateRoot = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

export const EstimateRoot: FC<TEstimateRoot> = observer((props) => {
  const { workspaceSlug, projectId, isAdmin } = props;
  // hooks
  const { loader, currentActiveEstimateId, estimateById, archivedEstimateIds, getProjectEstimates } =
    useProjectEstimates();
  // states
  const [isEstimateCreateModalOpen, setIsEstimateCreateModalOpen] = useState(false);
  // const [isEstimateDeleteModalOpen, setIsEstimateDeleteModalOpen] = useState<string | null>(null);
  const [estimateToUpdate, setEstimateToUpdate] = useState<IEstimate | undefined>();

  const { isLoading: isSWRLoading } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ESTIMATES_${workspaceSlug}_${projectId}` : null,
    async () => workspaceSlug && projectId && getProjectEstimates(workspaceSlug, projectId)
  );

  const onEditClick = (estimateId: string) => {
    const currentEstimate = estimateById(estimateId);
    setEstimateToUpdate(currentEstimate);
    setIsEstimateCreateModalOpen(true);
  };

  return (
    <div className="container mx-auto">
      {/* <EstimateLoaderScreen />
      <EstimateEmptyScreen onButtonClick={() => {}} /> */}

      {loader === "init-loader" || isSWRLoading ? (
        <EstimateLoaderScreen />
      ) : (
        <div className="space-y-10">
          {/* header */}
          <div className="text-xl font-medium text-custom-text-100 border-b border-custom-border-200 py-3.5">
            Estimates
          </div>

          {currentActiveEstimateId ? (
            <div className="space-y-4">
              {/* estimates activated deactivated section */}
              <div className="relative border-b border-custom-border-200 pb-4 flex justify-between items-center gap-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium text-custom-text-100">Enable estimates for my project</h3>
                  <p className="text-sm text-custom-text-200">
                    They help you in communicating complexity and workload of the team.
                  </p>
                </div>
                <EstimateDisableSwitch workspaceSlug={workspaceSlug} projectId={projectId} isAdmin={isAdmin} />
              </div>
              {/* active estimates section */}
              <EstimateList
                estimateIds={[currentActiveEstimateId]}
                isAdmin={isAdmin}
                isEditable
                onEditClick={onEditClick}
              />
            </div>
          ) : (
            <EstimateEmptyScreen onButtonClick={() => setIsEstimateCreateModalOpen(true)} />
          )}

          {/* archived estimates section */}
          {archivedEstimateIds && archivedEstimateIds.length > 0 && (
            <div>
              <div className="border-b border-custom-border-200 space-y-1 pb-4">
                <h3 className="text-lg font-medium text-custom-text-100">Archived estimates</h3>
                <p className="text-sm text-custom-text-200">
                  Estimates have gone through a change, these are the estimates you had in your older versions which
                  were not in use. Read more about them&nbsp;
                  <a href={"#"} target="_blank" className="text-custom-primary-100/80 hover:text-custom-primary-100">
                    here.
                  </a>
                </p>
              </div>
              <EstimateList estimateIds={archivedEstimateIds} isAdmin={isAdmin} />
            </div>
          )}
        </div>
      )}

      {/* modals for create and update */}
      <CreateEstimateModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isEstimateCreateModalOpen}
        data={estimateToUpdate}
        handleClose={() => {
          setIsEstimateCreateModalOpen(false);
          setEstimateToUpdate(undefined);
        }}
      />
      {/* <DeleteEstimateModal
        isOpen={!!isEstimateDeleteModalOpen}
        handleClose={() => setIsEstimateDeleteModalOpen(null)}
        data={}
      /> */}
    </div>
  );
});
