import { useParams } from "next/navigation";
import { X } from "lucide-react";
import { Popover } from "@headlessui/react";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { INTAKE_FEATURES_LIST } from "@/plane-web/constants";
import IntakeSubFeatures from "./intake-sub-features";
import IntakeSubFeaturesUpgrade from "./intake-sub-features-upgrade";

const IntakeTooltip = ({ projectId }: { projectId: string }) => {
  const { workspaceSlug } = useParams();
  return (
    <div className="p-2">
      <div className="flex justify-between">
        <span className="text-sm font-semibold"> Intake info</span>

        <Popover.Button>
          <X size={16} />
        </Popover.Button>
      </div>
      <WithFeatureFlagHOC
        workspaceSlug={workspaceSlug?.toString()}
        flag="INTAKE_SETTINGS"
        fallback={
          <IntakeSubFeaturesUpgrade
            showDefault={false}
            projectId={projectId}
            featureList={INTAKE_FEATURES_LIST}
            isTooltip
          />
        }
      >
        <IntakeSubFeatures
          allowEdit={false}
          showDefault={false}
          projectId={projectId}
          featureList={INTAKE_FEATURES_LIST}
          isTooltip
        />
      </WithFeatureFlagHOC>
    </div>
  );
};
export default IntakeTooltip;
