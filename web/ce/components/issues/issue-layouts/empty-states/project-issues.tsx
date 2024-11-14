import { observer } from "mobx-react";
// components
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { EIssuesStoreType, TCreateModalStoreTypes } from "@/constants/issue";

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

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <EmptyState
        type={emptyStateType || EmptyStateType.PROJECT_NO_ISSUES}
        additionalPath={additionalPath}
        primaryButtonOnClick={
          issueFilterCount > 0
            ? undefined
            : () => {
                setTrackElement("Project issue empty state");
                toggleCreateIssueModal(true, EIssuesStoreType.PROJECT);
              }
        }
        secondaryButtonOnClick={issueFilterCount > 0 ? handleClearAllFilters : undefined}
      />
    </div>
  );
});
