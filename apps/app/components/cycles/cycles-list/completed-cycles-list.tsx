import { useRouter } from "next/router";

import useSWR from "swr";

// services
import cyclesService from "services/cycles.service";
// components
import { CyclesView } from "components/cycles";
// fetch-keys
import { COMPLETED_CYCLES_LIST } from "constants/fetch-keys";

type Props = {
  viewType: string | null;
};

export const CompletedCyclesList: React.FC<Props> = ({ viewType }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: completedCyclesList, mutate } = useSWR(
    workspaceSlug && projectId ? COMPLETED_CYCLES_LIST(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () =>
          cyclesService.getCyclesWithParams(
            workspaceSlug.toString(),
            projectId.toString(),
            "completed"
          )
      : null
  );

  return <CyclesView cycles={completedCyclesList} mutateCycles={mutate} viewType={viewType} />;
};
