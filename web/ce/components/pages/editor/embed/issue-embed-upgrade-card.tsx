// plane ui
import { getButtonStyling } from "@plane/ui";
// components
import { ProIcon } from "@/components/common";
// helpers
import { cn } from "@/helpers/common.helper";

export const IssueEmbedUpgradeCard: React.FC<any> = (props) => (
  <div
    className={cn(
      "w-full h-20 bg-custom-background-80 rounded-md border-[0.5px] border-custom-border-200 shadow-custom-shadow-2xs",
      {
        "border-2": props.selected,
      }
    )}
  >
    <div className="flex items-center justify-between gap-5 mt-2.5 pl-4 pr-5 py-3 w-full max-md:max-w-full max-md:flex-wrap rounded-md">
      <div className="flex items-center gap-4">
        <ProIcon className="flex-shrink-0 size-4" />
        <p className="text-custom-text !text-base">
          Embed and access issues in pages seamlessly, upgrade to Plane Pro now.
        </p>
      </div>
      <a
        href="https://plane.so/pro"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(getButtonStyling("primary", "md"), "no-underline")}
      >
        Upgrade
      </a>
    </div>
  </div>
);
