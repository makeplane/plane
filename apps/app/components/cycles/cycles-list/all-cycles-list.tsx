import { useRouter } from "next/router";

import useSWR from "swr";

// services
import cyclesService from "services/cycles.service";
// components
import { CyclesView } from "components/cycles";
// fetch-keys
import { CYCLE_LIST } from "constants/fetch-keys";

type Props = {
  viewType: string | null;
};

export const AllCyclesList: React.FC<Props> = ({ viewType }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: allCyclesList } = useSWR(
    workspaceSlug && projectId ? CYCLE_LIST(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () =>
          cyclesService.getCyclesWithParams(workspaceSlug.toString(), projectId.toString(), {
            cycle_view: "all",
          })
      : null
  );

  return <CyclesView cycles={allCyclesList} viewType={viewType} />;
};
