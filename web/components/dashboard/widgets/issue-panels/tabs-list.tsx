import { observer } from "mobx-react";
import { Tab } from "@headlessui/react";
import { TIssuesListTypes } from "@plane/types";
// helpers
import { EDurationFilters, FILTERED_ISSUES_TABS_LIST, UNFILTERED_ISSUES_TABS_LIST } from "@/constants/dashboard";
import { cn } from "@/helpers/common.helper";
// types
// constants

type Props = {
  durationFilter: EDurationFilters;
  selectedTab: TIssuesListTypes;
};

export const TabsList: React.FC<Props> = observer((props) => {
  const { durationFilter, selectedTab } = props;

  const tabsList = durationFilter === "none" ? UNFILTERED_ISSUES_TABS_LIST : FILTERED_ISSUES_TABS_LIST;
  const selectedTabIndex = tabsList.findIndex((tab) => tab.key === selectedTab);

  return (
    <Tab.List
      as="div"
      className="relative border-[0.5px] border-custom-border-200 rounded bg-custom-background-80 p-[1px] grid"
      style={{
        gridTemplateColumns: `repeat(${tabsList.length}, 1fr)`,
      }}
    >
      <div
        className={cn(
          "absolute top-1/2 left-[1px] bg-custom-background-100 rounded-[3px] transition-all duration-500 ease-in-out",
          {
            // right shadow
            "shadow-[2px_0_8px_rgba(167,169,174,0.15)]": selectedTabIndex !== tabsList.length - 1,
            // left shadow
            "shadow-[-2px_0_8px_rgba(167,169,174,0.15)]": selectedTabIndex !== 0,
          }
        )}
        style={{
          height: "calc(100% - 2px)",
          width: `calc(${100 / tabsList.length}% - 1px)`,
          transform: `translate(${selectedTabIndex * 100}%, -50%)`,
        }}
      />
      {tabsList.map((tab) => (
        <Tab
          key={tab.key}
          className={cn(
            "relative z-[1] font-semibold text-xs rounded-[3px] py-1.5 text-custom-text-400 focus:outline-none transition duration-500",
            {
              "text-custom-text-100": selectedTab === tab.key,
              "hover:text-custom-text-300": selectedTab !== tab.key,
            }
          )}
        >
          <span className="scale-110">{tab.label}</span>
        </Tab>
      ))}
    </Tab.List>
  );
});
