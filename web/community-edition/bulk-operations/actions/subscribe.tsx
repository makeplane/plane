import { useState } from "react";
import { observer } from "mobx-react";
import { BellDot } from "lucide-react";
// ui
import { SubscribeIcon, Tooltip } from "@plane/ui";

export const BulkSubscribeIssues: React.FC = observer(() => {
  // states
  const [isBulkSubscribeModalOpen, setIsBulkSubscribeModalOpen] = useState(false);

  return (
    <Tooltip tooltipHeading="Subscribe" tooltipContent="">
      <button
        type="button"
        className="outline-none grid place-items-center"
        onClick={() => setIsBulkSubscribeModalOpen(true)}
      >
        <SubscribeIcon className="size-4" />
      </button>
    </Tooltip>
  );
});
