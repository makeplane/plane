import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { X } from "lucide-react";
import { Popover } from "@headlessui/react";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
// plane web components
import { INTAKE_FEATURES_LIST } from "@/plane-web/constants";
// hooks
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// local components
import IntakeSubFeatures from "./intake-sub-features";
import IntakeSubFeaturesUpgrade from "./intake-sub-features-upgrade";

const IntakeTooltip = observer(({ projectId }: { projectId: string }) => {
  const { workspaceSlug } = useParams();
  const isEmailEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_EMAIL);
  const isFormEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_FORM);

  return (
    <div className="p-2">
      <div className="flex justify-between">
        <span className="text-sm font-semibold"> Intake info</span>

        <Popover.Button>
          <X size={16} />
        </Popover.Button>
      </div>
      {isEmailEnabled || isFormEnabled ? (
        <IntakeSubFeatures
          allowEdit={false}
          showDefault={false}
          projectId={projectId}
          featureList={INTAKE_FEATURES_LIST}
          isTooltip
        />
      ) : (
        <IntakeSubFeaturesUpgrade
          showDefault={false}
          projectId={projectId}
          featureList={INTAKE_FEATURES_LIST}
          isTooltip
        />
      )}
    </div>
  );
});

export default IntakeTooltip;
