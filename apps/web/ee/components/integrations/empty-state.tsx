import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
// constants
import { E_FEATURE_FLAGS } from "@plane/constants";
// helpers
import { cn } from "@plane/utils";
// components
import { UpgradeEmptyStateButton } from "../workspace/upgrade-empty-state-button";

export type IntegrationsEmptyStateProps = {
  theme: string;
};

export const IntegrationsEmptyState: FC<IntegrationsEmptyStateProps> = observer((props) => {
  const { theme } = props;
  // router
  const { workspaceSlug } = useParams();
  // derived values
  const isDarkMode = theme === "dark";

  return (
    <div className="flex h-full flex-col gap-5 rounded-xl">
      <div
        className={cn("item-center flex min-h-[25rem] justify-between rounded-xl", {
          "bg-gradient-to-l from-[#343434] via-[#484848]  to-[#1E1E1E]": theme === "dark",
          "bg-gradient-to-l from-[#EBEBEB] to-[#FAFAFA] border border-custom-border-400": theme === "light",
        })}
      >
        <div className="relative flex flex-col justify-center gap-7 pl-8 lg:w-1/2">
          <div className="flex max-w-96 flex-col gap-2">
            <h2 className="text-2xl font-semibold">Popular integrations are coming soon!</h2>
            <p className="text-base font-medium text-custom-text-300">
              Send changes in issues to Slack, turn a Support email into a ticket in Plane, and more—coming soon to Pro
              on Plane Cloud and One.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <UpgradeEmptyStateButton
              workspaceSlug={workspaceSlug?.toString()}
              flag={E_FEATURE_FLAGS.SILO_INTEGRATIONS}
            />
          </div>
        </div>
        <div className="relative hidden w-1/2 lg:block">
          <span className="absolute bottom-0 right-0">
            <Image
              src={`/upcoming-features/integrations-cta-1-${isDarkMode ? "dark" : "light"}.png`}
              height={420}
              width={420}
              alt="cta-1"
            />
          </span>
          <span className="absolute -bottom-16 right-1/2 rounded-xl">
            <Image
              src={`/upcoming-features/integrations-cta-2-${isDarkMode ? "dark" : "light"}.png`}
              height={210}
              width={280}
              alt="cta-2"
            />
          </span>
        </div>
      </div>
    </div>
  );
});
