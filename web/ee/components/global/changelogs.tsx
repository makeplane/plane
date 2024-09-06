import { useState } from "react";
import { observer } from "mobx-react";
import { ScrollText } from "lucide-react";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// local components
import { PlaneOneModal } from "../license";

export const PlaneChangelogs = observer(() => {
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // states
  const [isPlaneOneModalOpen, setIsPlaneOneModalOpen] = useState(false);

  if (subscriptionDetail?.product === "ONE") {
    return (
      <span>
        <PlaneOneModal isOpen={isPlaneOneModalOpen} handleClose={() => setIsPlaneOneModalOpen(false)} />
        <span
          className="flex items-center gap-x-2 rounded px-2 py-1 text-xs hover:bg-custom-background-80 cursor-pointer"
          onClick={() => setIsPlaneOneModalOpen(true)}
        >
          <div className="grid flex-shrink-0 place-items-center">
            <ScrollText className="h-3.5 w-3.5 text-custom-text-200" size={14} />
          </div>
          <span className="text-xs">Changelog</span>
        </span>
      </span>
    );
  }
});
