import { observer } from "mobx-react";
import { Tab } from "@headlessui/react";
// helpers
import { cn } from "helpers/common.helper";
// types
import { TDurationFilterOptions, TIssuesListTypes } from "@plane/types";
// constants
import { FILTERED_ISSUES_TABS_LIST, UNFILTERED_ISSUES_TABS_LIST } from "constants/dashboard";

type Props = {
  durationFilter: TDurationFilterOptions;
  selectedTab: TIssuesListTypes;
};

export const TabsList: React.FC<Props> = observer((props) => {
  const { durationFilter, selectedTab } = props;

  const tabsList = durationFilter === "none" ? UNFILTERED_ISSUES_TABS_LIST : FILTERED_ISSUES_TABS_LIST;
  const selectedTabIndex = tabsList.findIndex((tab) => tab.key === (selectedTab ?? "pending"));

  return (
    <Tab.List
      as="div"
      className="relative border-[0.5px] border-neutral-border-medium rounded bg-custom-background-80 grid"
      style={{
        gridTemplateColumns: `repeat(${tabsList.length}, 1fr)`,
      }}
    >
      <div
        className={cn("absolute bg-custom-background-100 rounded transition-all duration-500 ease-in-out", {
          // right shadow
          "shadow-[2px_0_8px_rgba(167,169,174,0.15)]": selectedTabIndex !== tabsList.length - 1,
          // left shadow
          "shadow-[-2px_0_8px_rgba(167,169,174,0.15)]": selectedTabIndex !== 0,
        })}
        style={{
          height: "calc(100% - 1px)",
          width: `${100 / tabsList.length}%`,
          transform: `translateX(${selectedTabIndex * 100}%)`,
        }}
      />
      {tabsList.map((tab) => (
        <Tab
          key={tab.key}
          className={cn(
            "relative z-[1] font-semibold text-xs rounded py-1.5 text-neutral-text-subtle focus:outline-none",
            "transition duration-500",
            {
              "text-neutral-text-strong bg-custom-background-100": selectedTab === tab.key,
              "hover:text-neutral-text-medium": selectedTab !== tab.key,
              // // right shadow
              // "shadow-[2px_0_8px_rgba(167,169,174,0.15)]": selectedTabIndex !== tabsList.length - 1,
              // // left shadow
              // "shadow-[-2px_0_8px_rgba(167,169,174,0.15)]": selectedTabIndex !== 0,
            }
          )}
        >
          <span className="scale-110">{tab.label}</span>
        </Tab>
      ))}
    </Tab.List>
  );
});
