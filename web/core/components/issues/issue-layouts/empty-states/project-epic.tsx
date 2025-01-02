// types
// components
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks

export const ProjectEpicsEmptyState: React.FC = () => (
  <div className="relative h-full w-full overflow-y-auto">
    <EmptyState type={EmptyStateType.PROJECT_NO_EPICS} primaryButtonOnClick={() => {}} />
  </div>
);
