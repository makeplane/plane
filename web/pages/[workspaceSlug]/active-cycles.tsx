import { ReactElement } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import useSWR from "swr";
// components
import { ActiveCycleDetails, ActiveCycleInfo } from "components/cycles";
// services
import { CycleService } from "services/cycle.service";
const cycleService = new CycleService();
// layouts
import { AppLayout } from "layouts/app-layout";
// types
import { NextPageWithLayout } from "lib/types";

const WorkspaceActiveCyclesPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // fetching active cycles in workspace
  const { data } = useSWR("WORKSPACE_ACTIVE_CYCLES", () => cycleService.workspaceActiveCycles(workspaceSlug as string));

  console.log(data);

  return (
    <div>
      {data &&
        workspaceSlug &&
        data.map((cycle) => (
          <div key={cycle.id}>
            {cycle.name}
            <ActiveCycleInfo workspaceSlug={workspaceSlug?.toString()} projectId={cycle.project} cycle={cycle} />
          </div>
        ))}
    </div>
  );
});

WorkspaceActiveCyclesPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<></>}>{page}</AppLayout>;
};

export default WorkspaceActiveCyclesPage;
