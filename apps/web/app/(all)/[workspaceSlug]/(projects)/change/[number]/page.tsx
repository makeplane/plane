import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { ChangeDetail } from "@/components/change-management";
import { useChangeManagement } from "@/hooks/store/use-change-management";
import { ArrowLeft } from "lucide-react";

const ChangeDetailPage = observer(() => {
  const { workspaceSlug, number } = useParams();
  const router = useRouter();
  const store = useChangeManagement();
  
  const changeNumber = number ? decodeURIComponent(number.toString()) : undefined;
  const change = changeNumber ? store.changeMap[changeNumber] : undefined;

  useEffect(() => {
    if (workspaceSlug && changeNumber) {
      const slug = workspaceSlug.toString();
      store.fetchChangeByNumber(slug, changeNumber).catch(() => {
        // Handle 404 naturally
      });
      store.fetchApprovals(slug, changeNumber);
      store.fetchTasks(slug, changeNumber);
      store.fetchActivity(slug, changeNumber);
    }
  }, [workspaceSlug, changeNumber, store]);

  if (store.loader && !change) {
    return (
      <div className="flex-1 flex justify-center items-center bg-custom-background-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-custom-primary-100" />
      </div>
    );
  }

  if (!change) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-custom-background-100">
        <h2 className="text-xl font-medium text-custom-text-100">Change Not Found</h2>
        <p className="text-custom-text-200 mt-2">The requested change request does not exist or you don't have permission to view it.</p>
        <button 
          onClick={() => router.push(`/${workspaceSlug}/change/overview`)}
          className="mt-6 flex items-center gap-2 text-custom-primary-100 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Overview
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden bg-custom-background-100 flex flex-col">
      <ChangeDetail change={change} workspaceSlug={workspaceSlug!.toString()} />
    </div>
  );
});

export default ChangeDetailPage;
