import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// components
import {
  EstimateLoaderScreen,
  EstimateEmptyScreen,
  EstimateDisableSwitch,
  CreateEstimateModal,
  DeleteEstimateModal,
  EstimateList,
} from "@/components/estimates";
// hooks
import { useProject, useProjectEstimates } from "@/hooks/store";
// plane web components
import { UpdateEstimateModal } from "@/plane-web/components/estimates";

type TEstimateRoot = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

export const EstimateRoot: FC<TEstimateRoot> = observer((props) => {
  const { workspaceSlug, projectId, isAdmin } = props;
  // hooks
  const { currentProjectDetails } = useProject();
  const { loader, currentActiveEstimateId, archivedEstimateIds, getProjectEstimates } = useProjectEstimates();
  // states
  const [isEstimateCreateModalOpen, setIsEstimateCreateModalOpen] = useState(false);
  const [estimateToUpdate, setEstimateToUpdate] = useState<string | undefined>();
  const [estimateToDelete, setEstimateToDelete] = useState<string | undefined>();

  const { isLoading: isSWRLoading } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ESTIMATES_${workspaceSlug}_${projectId}` : null,
    async () => workspaceSlug && projectId && getProjectEstimates(workspaceSlug, projectId)
  );

  return (
    <div className="container mx-auto">
      {loader === "init-loader" || isSWRLoading ? (
        <EstimateLoaderScreen />
      ) : (
        <div className="space-y-2">
          {/* header */}
          <div className="flex flex-col items-start border-b border-custom-border-100 pb-3.5">
            <h3 className="text-xl font-medium leading-normal">Estimates</h3>
          </div>

          {/* current active estimate section */}
          {currentActiveEstimateId ? (
            <div className="">
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
                isEstimateEnabled={Boolean(currentProjectDetails?.estimate)}
                isEditable
                onEditClick={(estimateId: string) => setEstimateToUpdate(estimateId)}
                onDeleteClick={(estimateId: string) => setEstimateToDelete(estimateId)}
              />
            </div>
          ) : (
            <EstimateEmptyScreen onButtonClick={() => setIsEstimateCreateModalOpen(true)} />
          )}

          {/* archived estimates section */}
          {archivedEstimateIds && archivedEstimateIds.length > 0 && (
            <div className="">
              <div className="border-b border-custom-border-200 space-y-1 pb-4">
                <h3 className="text-lg font-medium text-custom-text-100">Archived estimates</h3>
                <p className="text-sm text-custom-text-200">
                  Estimates have gone through a change, these are the estimates you had in your older versions which
                  were not in use. Read more about them&nbsp;
                  <a
                    href={"https://docs.plane.so/core-concepts/projects/run-project#estimate"}
                    target="_blank"
                    className="text-custom-primary-100/80 hover:text-custom-primary-100"
                  >
                    here.
                  </a>
                </p>
              </div>
              <EstimateList estimateIds={archivedEstimateIds} isAdmin={isAdmin} />
            </div>
          )}
        </div>
      )}

      {/* CRUD modals */}
      <CreateEstimateModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isEstimateCreateModalOpen}
        handleClose={() => setIsEstimateCreateModalOpen(false)}
      />
      <UpdateEstimateModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        estimateId={estimateToUpdate ? estimateToUpdate : undefined}
        isOpen={estimateToUpdate ? true : false}
        handleClose={() => setEstimateToUpdate(undefined)}
      />
      <DeleteEstimateModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        estimateId={estimateToDelete ? estimateToDelete : undefined}
        isOpen={estimateToDelete ? true : false}
        handleClose={() => setEstimateToDelete(undefined)}
      />
    </div>
  );
});
