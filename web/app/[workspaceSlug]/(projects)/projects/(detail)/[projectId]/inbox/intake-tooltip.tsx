import IntakeSubFeatures from "@/components/project/settings/intake-sub-features";
import { X } from "lucide-react";
import { Popover } from "@headlessui/react";

const IntakeTooltip = () => {
  return (
    <div className="p-2">
      <div className="flex justify-between">
        <span className="text-sm font-semibold"> Intake info</span>

        <Popover.Button>
          <X size={16} />
        </Popover.Button>
      </div>
      <IntakeSubFeatures allowEdit={false} showDefault={false} />
    </div>
  );
};
export default IntakeTooltip;
