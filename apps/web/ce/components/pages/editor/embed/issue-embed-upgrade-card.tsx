// plane ui
import { getButtonStyling } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { ProIcon } from "@/components/common";
// helpers

export const IssueEmbedUpgradeCard: React.FC<any> = (props) => (
  <div
    className={cn(
      "w-full bg-custom-background-80 rounded-md border-[0.5px] border-custom-border-200 shadow-custom-shadow-2xs flex items-center justify-between gap-5 px-5 py-2 max-md:flex-wrap",
      {
        "border-2": props.selected,
      }
    )}
  >
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
);
