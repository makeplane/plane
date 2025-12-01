// components
import { CyclesListItem } from "./cycles-list-item";

type Props = {
  cycleIds: string[];
  projectId: string;
  workspaceSlug: string;
};

export function CyclesListMap(props: Props) {
  const { cycleIds, projectId, workspaceSlug } = props;

  return (
    <>
      {cycleIds.map((cycleId) => (
        <CyclesListItem key={cycleId} cycleId={cycleId} workspaceSlug={workspaceSlug} projectId={projectId} />
      ))}
    </>
  );
}
