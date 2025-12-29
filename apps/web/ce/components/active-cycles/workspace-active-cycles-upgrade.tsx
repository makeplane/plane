import { observer } from "mobx-react";
import { AlertOctagon, BarChart4, CircleDashed, Folder, Microscope } from "lucide-react";
// plane imports
import { MARKETING_PRICING_PAGE_LINK } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { getButtonStyling } from "@plane/propel/button";
import { SearchIcon } from "@plane/propel/icons";
import { ContentWrapper } from "@plane/ui";
import { cn } from "@plane/utils";
// assets
import ctaL1Dark from "@/app/assets/workspace-active-cycles/cta-l-1-dark.webp?url";
import ctaL1Light from "@/app/assets/workspace-active-cycles/cta-l-1-light.webp?url";
import ctaR1Dark from "@/app/assets/workspace-active-cycles/cta-r-1-dark.webp?url";
import ctaR1Light from "@/app/assets/workspace-active-cycles/cta-r-1-light.webp?url";
import ctaR2Dark from "@/app/assets/workspace-active-cycles/cta-r-2-dark.webp?url";
import ctaR2Light from "@/app/assets/workspace-active-cycles/cta-r-2-light.webp?url";
// components
import { ProIcon } from "@/components/common/pro-icon";
// hooks
import { useUser } from "@/hooks/store/user";

export const WORKSPACE_ACTIVE_CYCLES_DETAILS = [
  {
    key: "10000_feet_view",
    title: "10,000-feet view of all active cycles.",
    description:
      "Zoom out to see running cycles across all your projects at once instead of going from Cycle to Cycle in each project.",
    icon: Folder,
  },
  {
    key: "get_snapshot_of_each_active_cycle",
    title: "Get a snapshot of each active cycle.",
    description:
      "Track high-level metrics for all active cycles, see their state of progress, and get a sense of scope against deadlines.",
    icon: CircleDashed,
  },
  {
    key: "compare_burndowns",
    title: "Compare burndowns.",
    description: "Monitor how each of your teams are performing with a peek into each cycle’s burndown report.",
    icon: BarChart4,
  },
  {
    key: "quickly_see_make_or_break_issues",
    title: "Quickly see make-or-break work items. ",
    description:
      "Preview high-priority work items for each cycle against due dates. See all of them per cycle in one click.",
    icon: AlertOctagon,
  },
  {
    key: "zoom_into_cycles_that_need_attention",
    title: "Zoom into cycles that need attention. ",
    description: "Investigate the state of any cycle that doesn’t conform to expectations in one click.",
    icon: SearchIcon,
  },
  {
    key: "stay_ahead_of_blockers",
    title: "Stay ahead of blockers.",
    description:
      "Spot challenges from one project to another and see inter-cycle dependencies that aren’t obvious from any other view.",
    icon: Microscope,
  },
];

export const WorkspaceActiveCyclesUpgrade = observer(function WorkspaceActiveCyclesUpgrade() {
  const { t } = useTranslation();
  // store hooks
  const {
    userProfile: { data: userProfile },
  } = useUser();

  const isDarkMode = userProfile?.theme.theme === "dark";

  return (
    <ContentWrapper className="gap-10">
      <div
        className={cn("item-center flex min-h-[25rem] justify-between rounded-xl", {
          "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": userProfile?.theme.theme === "dark",
          "bg-gradient-to-l from-[#3b5ec6] to-[#f5f7fe]": userProfile?.theme.theme === "light",
        })}
      >
        <div className="relative flex flex-col justify-center gap-7 px-14 lg:w-1/2">
          <div className="flex max-w-64 flex-col gap-2">
            <h2 className="text-20 font-semibold">{t("on_demand_snapshots_of_all_your_cycles")}</h2>
            <p className="text-14 font-medium text-tertiary">{t("active_cycles_description")}</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              className={`${getButtonStyling("primary", "base")} cursor-pointer`}
              href={MARKETING_PRICING_PAGE_LINK}
              target="_blank"
              rel="noreferrer"
            >
              <ProIcon className="h-3.5 w-3.5 text-on-color" />
              {t("upgrade")}
            </a>
          </div>
          <span className="absolute left-0 top-0">
            <img
              src={isDarkMode ? ctaL1Dark : ctaL1Light}
              className="w-[125px] h-[125px] object-contain rounded-xl"
              alt="l-1"
            />
          </span>
        </div>
        <div className="relative hidden w-1/2 lg:block">
          <span className="absolute bottom-0 right-0">
            <img src={isDarkMode ? ctaR1Dark : ctaR1Light} className="w-full h-full object-contain" alt="r-1" />
          </span>
          <span className="absolute -bottom-16 right-1/2 rounded-xl">
            <img src={isDarkMode ? ctaR2Dark : ctaR2Light} className="w-full h-full object-contain" alt="r-2" />
          </span>
        </div>
      </div>
      <div className="grid h-full grid-cols-1 gap-5 pb-8 lg:grid-cols-2 xl:grid-cols-3">
        {WORKSPACE_ACTIVE_CYCLES_DETAILS.map((item) => (
          <div key={item.title} className="flex min-h-32 w-full flex-col gap-2 rounded-md bg-layer-1 p-4">
            <div className="flex gap-2 justify-between">
              <h3 className="font-medium">{t(item.key)}</h3>
              <item.icon className="mt-1 h-4 w-4 text-blue-500" />
            </div>
            <span className="text-13 text-tertiary">{t(`${item.key}_description`)}</span>
          </div>
        ))}
      </div>
    </ContentWrapper>
  );
});
