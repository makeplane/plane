import { useState } from "react";
import { useParams } from "next/navigation";
import { StopCircle } from "lucide-react";
//sto
import { useFlag } from "@/plane-web/hooks/store";

export const useEndCycle = (isCurrentCycle: boolean) => {
  const [isEndCycleModalOpen, setEndCycleModalOpen] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const isEndCycleEnabled = useFlag(workspaceSlug?.toString(), "CYCLE_MANUAL_START_STOP");

  const endCycleContextMenu = {
    key: "end-cycle",
    title: "End Cycle",
    icon: StopCircle,
    action: () => setEndCycleModalOpen(true),
    shouldRender: isCurrentCycle,
  };

  return {
    isEndCycleModalOpen,
    setEndCycleModalOpen,
    endCycleContextMenu: isEndCycleEnabled ? endCycleContextMenu : undefined,
  };
};
