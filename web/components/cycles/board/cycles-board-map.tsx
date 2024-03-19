// components
import { CyclesBoardCard } from "@/components/cycles";

type Props = {
  cycleIds: string[];
  peekCycle: string | undefined;
  projectId: string;
  workspaceSlug: string;
};

export const CyclesBoardMap: React.FC<Props> = (props) => {
  const { cycleIds, peekCycle, projectId, workspaceSlug } = props;

  return (
    <div
      className={`w-full grid grid-cols-1 gap-6 ${
        peekCycle ? "lg:grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3" : "lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4"
      } auto-rows-max transition-all`}
    >
      {cycleIds.map((cycleId) => (
        <CyclesBoardCard key={cycleId} workspaceSlug={workspaceSlug} projectId={projectId} cycleId={cycleId} />
      ))}
    </div>
  );
};
