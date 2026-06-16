import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { OverviewDashboard } from "@/components/change-management";
import { useChangeManagement } from "@/hooks/store/use-change-management";

const ChangeOverviewPage = observer(() => {
  const { workspaceSlug } = useParams();
  const store = useChangeManagement();

  useEffect(() => {
    if (workspaceSlug) {
      store.fetchOverview(workspaceSlug.toString());
    }
  }, [workspaceSlug, store]);

  return (
    <div className="flex-1 overflow-y-auto bg-custom-background-100">
      {store.loader ? (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-custom-primary-100" />
        </div>
      ) : store.overviewData ? (
        <OverviewDashboard data={store.overviewData} />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-custom-text-200">
          <p className="text-lg font-medium">No change data available</p>
          <p className="text-sm mt-1">Create a new change request to get started.</p>
        </div>
      )}
    </div>
  );
});

export default ChangeOverviewPage;
