import { X } from "lucide-react";
import { Popover } from "@headlessui/react";
import IntakeSubFeatures from "./intake-sub-features";

const IntakeTooltip = ({ projectId }: { projectId: string }) => (
  <div className="p-2">
    <div className="flex justify-between">
      <span className="text-sm font-semibold"> Intake info</span>

      <Popover.Button>
        <X size={16} />
      </Popover.Button>
    </div>
    <IntakeSubFeatures allowEdit={false} showDefault={false} projectId={projectId} />
  </div>
);
export default IntakeTooltip;
