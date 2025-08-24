// plane imports
import { getButtonStyling } from "@plane/ui";
import { cn } from "@plane/utils";
import { ProBadge } from "@/plane-editor/components/badges/pro-badge";

export const UpgradeNowModal: React.FC = () => (
  <div className="bg-custom-background-100 border border-custom-border-200 rounded-lg w-72 my-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
    <div className="flex flex-col space-y-2 p-3 pb-0">
      <ProBadge />

      {/* Title */}
      <h3 className="text-base font-semibold text-custom-text-100 leading-tight">Upgrade to access this feature.</h3>
      {/* Description */}
      <p className="text-sm text-custom-text-200 leading-relaxed">
        This is a paid feature. You can upgrade your workspace to let all your members use it.
      </p>
    </div>

    {/* Action button */}
    <a
      href="https://plane.so/pricing"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(getButtonStyling("primary", "sm"), "no-underline w-fit text-center text-sm mt-4 mb-3 mx-3")}
    >
      Upgrade now
    </a>
  </div>
);
