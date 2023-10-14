import { useRouter } from "next/router";

import useSWR from "swr";

// services
import { CycleService } from "services/cycle.service";
// components
import { CyclesView } from "components/cycles";
// fetch-keys
import { UPCOMING_CYCLES_LIST } from "constants/fetch-keys";

type Props = {
  viewType: string | null;
};

// services
const cycleService = new CycleService();

export const UpcomingCyclesList: React.FC<Props> = ({ viewType }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: upcomingCyclesList, mutate } = useSWR(
    workspaceSlug && projectId ? UPCOMING_CYCLES_LIST(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () => cycleService.getCyclesWithParams(workspaceSlug.toString(), projectId.toString(), "upcoming")
      : null
  );

  return <CyclesView cycles={upcomingCyclesList} mutateCycles={mutate} viewType={viewType} />;
};
