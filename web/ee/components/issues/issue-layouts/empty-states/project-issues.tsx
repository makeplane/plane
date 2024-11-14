import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { ResolvedProjectEmptyState as CeProjectEmptyState } from "@/ce/components/issues";
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { EIssuesStoreType, TCreateModalStoreTypes } from "@/constants/issue";
// hooks
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { ProjectPlannerModal } from "@/plane-web/components/project-planner";
import { E_FEATURE_FLAGS } from "@/plane-web/hooks/store";

type TProps = {
  issueFilterCount: number;
  additionalPath?: string;
  handleClearAllFilters: () => void;
  toggleCreateIssueModal: (value?: boolean | undefined, storeType?: TCreateModalStoreTypes | undefined) => void;
  setTrackElement: (element: string) => void;
  emptyStateType?: EmptyStateType;
};
export const ResolvedProjectEmptyState: React.FC<TProps> = observer((props) => {
  const {
    issueFilterCount,
    additionalPath,
    handleClearAllFilters,
    toggleCreateIssueModal,
    setTrackElement,
    emptyStateType,
  } = props;
  // states
  const [openPlannerModal, setOpenPlannerModal] = useState(false);
  // router
  const { workspaceSlug } = useParams();

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <WithFeatureFlagHOC
        workspaceSlug={workspaceSlug.toString()}
        flag={E_FEATURE_FLAGS.PI_PLANNER}
        fallback={
          <CeProjectEmptyState
            issueFilterCount={issueFilterCount}
            additionalPath={additionalPath}
            handleClearAllFilters={handleClearAllFilters}
            toggleCreateIssueModal={toggleCreateIssueModal}
            setTrackElement={setTrackElement}
          />
        }
      >
        <>
          <ProjectPlannerModal isOpen={openPlannerModal} onClose={() => setOpenPlannerModal(false)} />
          <EmptyState
            type={emptyStateType || EmptyStateType.PRO_PROJECT_NO_ISSUES}
            additionalPath={additionalPath}
            primaryButtonOnClick={
              issueFilterCount > 0
                ? undefined
                : () => {
                    setTrackElement("Project issue empty state");
                    toggleCreateIssueModal(true, EIssuesStoreType.PROJECT);
                  }
            }
            secondaryButtonOnClick={() => setOpenPlannerModal(true)}
          />
        </>
      </WithFeatureFlagHOC>
    </div>
  );
});
