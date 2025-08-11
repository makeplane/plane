import { Crown } from "lucide-react";
import { Button } from "@plane/ui";

export const IssueEmbedUpgradeCard = () => (
  <div
    className={
      "w-full h-min cursor-pointer space-y-2.5 rounded-lg bg-[#F3F4F7] border-[0.5px] border-custom-border-200 shadow-custom-shadow-2xs"
    }
  >
    <div className="relative h-[71%]">
      <div className="h-full backdrop-filter backdrop-blur-[30px] bg-opacity-30 flex items-center w-full justify-between gap-5  pl-4 pr-5 py-3 max-md:max-w-full max-md:flex-wrap relative">
        <div className="flex-col items-center">
          <div className="rounded p-2 bg-white w-min mb-3">
            <Crown size={16} color="#FFBA18" />
          </div>
          <div className="text-custom-text text-base">
            Embed and access issues in pages seamlessly, upgrade to plane pro now.
          </div>
        </div>
        <Button className="py-2" variant="primary" onClick={() => {}}>
          Upgrade
        </Button>
      </div>
    </div>
  </div>
);
