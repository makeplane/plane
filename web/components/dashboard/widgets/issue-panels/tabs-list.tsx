import { Tab } from "@headlessui/react";
// helpers
import { cn } from "helpers/common.helper";
// types
import { TIssuesListTypes } from "@plane/types";
// constants
import { ISSUES_TABS_LIST } from "constants/dashboard";

type Props = {
  selectedTab: TIssuesListTypes;
};

export const TabsList: React.FC<Props> = (props) => {
  const { selectedTab } = props;
  const selectedTabIndex = ISSUES_TABS_LIST.findIndex((tab) => tab.key === selectedTab);

  return (
    <Tab.List
      as="div"
      className="relative border-[0.5px] border-custom-border-200 rounded grid grid-cols-3 bg-custom-background-80"
    >
      <div
        className={cn("absolute w-1/3 bg-custom-background-100 rounded transition-all duration-500 ease-in-out", {
          "shadow-[2px_0_8px_rgba(167,169,174,0.15)]": [0, 1].includes(selectedTabIndex),
          "shadow-[-2px_0_8px_rgba(167,169,174,0.15)]": [1, 2].includes(selectedTabIndex),
        })}
        style={{
          height: "calc(100% - 1px)",
          transform: `translateX(${selectedTabIndex * 100}%)`,
        }}
      />
      {ISSUES_TABS_LIST.map((tab) => (
        <Tab
          key={tab.key}
          className={({ selected }) =>
            cn(
              "relative z-[1] font-semibold text-xs rounded py-1.5 text-custom-text-400 focus:outline-none transition duration-500",
              {
                "text-custom-text-100": selected,
                "hover:text-custom-text-300": !selected,
              }
            )
          }
        >
          <span className="scale-110">{tab.label}</span>
        </Tab>
      ))}
    </Tab.List>
  );
};
