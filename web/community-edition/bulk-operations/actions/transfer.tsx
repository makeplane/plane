import { observer } from "mobx-react";
import { FolderSync } from "lucide-react";
// ui
import { Tooltip } from "@plane/ui";
// constants
import { MARKETING_PRICING_PAGE_LINK } from "@/constants/common";

export const BulkTransferIssues: React.FC = observer(() => (
  <Tooltip tooltipHeading="Transfer to another project" tooltipContent="">
    <a
      href={MARKETING_PRICING_PAGE_LINK}
      className="outline-none grid place-items-center"
      target="_blank"
      rel="noopener noreferrer"
    >
      <FolderSync className="size-4" />
    </a>
  </Tooltip>
));
