// components
import { CyclesListItem } from "@/components/cycles";

type Props = {
  cycleIds: string[];
  projectId: string;
  workspaceSlug: string;
  isArchived?: boolean;
};

export const CyclesListMap: React.FC<Props> = (props) => {
  const { cycleIds, projectId, workspaceSlug, isArchived } = props;

  return (
    <>
      {cycleIds.map((cycleId) => (
        <CyclesListItem
          key={cycleId}
          cycleId={cycleId}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          isArchived={isArchived}
        />
      ))}
    </>
  );
};
