import { useState } from "react";
import { useParams } from "next/navigation";
import { Share2 } from "lucide-react";
import { CustomMenu } from "@plane/ui";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { E_FEATURE_FLAGS } from "@/plane-web/hooks/store";
import { ProjectPlannerModal } from "./planner-modal";

export const PlannerCustomMenu = () => {
  const [plannerModalOpen, setPlannerModal] = useState(false);
  const { workspaceSlug } = useParams();
  return (
    <>
      <ProjectPlannerModal isOpen={plannerModalOpen} onClose={() => setPlannerModal(false)} />
      <WithFeatureFlagHOC workspaceSlug={workspaceSlug.toString()} flag={E_FEATURE_FLAGS.PI_PLANNER} fallback={null}>
        <CustomMenu.MenuItem onClick={() => setPlannerModal(true)}>
          <div className="relative flex flex-shrink-0 items-center justify-start gap-2">
            <div className="flex h-4 w-4 cursor-pointer items-center justify-center rounded text-custom-sidebar-text-200 transition-all duration-300 hover:bg-custom-sidebar-background-80">
              {/* TODO: Change icon */}
              <Share2 className="h-3.5 w-3.5 stroke-[1.5]" />
            </div>
            <span>Project Planner</span>
          </div>
        </CustomMenu.MenuItem>
      </WithFeatureFlagHOC>
    </>
  );
};
