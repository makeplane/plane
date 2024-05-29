import { useState } from "react";
import { observer } from "mobx-react";
import { Crown, FolderSync } from "lucide-react";
// ui
import { Tooltip } from "@plane/ui";
// components
import { UpgradeToProModal } from "@/components/core";

export const BulkTransferIssues: React.FC = observer(() => {
  // states
  const [isUpgradeToProModalOpen, setIsUpgradeToProModalOpen] = useState(false);

  return (
    <>
      <UpgradeToProModal isOpen={isUpgradeToProModalOpen} onClose={() => setIsUpgradeToProModalOpen(false)} />
      <Tooltip tooltipHeading="Transfer to another project" tooltipContent="">
        <a
          href="https://plane.so/pricing"
          className="relative outline-none grid place-items-center"
          onClick={(e) => {
            if (window.innerWidth >= 768) {
              e.preventDefault();
              e.stopPropagation();
              setIsUpgradeToProModalOpen(true);
            }
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FolderSync className="size-4" />
          <span className="absolute -top-3 -right-2 size-[18px] bg-custom-background-100 rounded-full grid place-items-center">
            <span className="size-[18px] bg-yellow-500/10 rounded-full grid place-items-center">
              <Crown className="size-3 text-yellow-500" />
            </span>
          </span>
        </a>
      </Tooltip>
    </>
  );
});
