import { useRouter } from "next/router";

import useSWR from "swr";

// services
import cyclesService from "services/cycles.service";
// components
import { CyclesView } from "components/cycles";
// fetch-keys
import { DRAFT_CYCLES_LIST } from "constants/fetch-keys";

type Props = {
  viewType: string | null;
};

export const DraftCyclesList: React.FC<Props> = ({ viewType }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: draftCyclesList, mutate } = useSWR(
    workspaceSlug && projectId ? DRAFT_CYCLES_LIST(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () =>
          cyclesService.getCyclesWithParams(workspaceSlug.toString(), projectId.toString(), "draft")
      : null
  );

  return <CyclesView cycles={draftCyclesList} mutateCycles={mutate} viewType={viewType} />;
};
