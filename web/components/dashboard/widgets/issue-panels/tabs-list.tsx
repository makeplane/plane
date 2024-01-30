import { Tab } from "@headlessui/react";
// helpers
import { cn } from "helpers/common.helper";
// constants
import { ISSUES_TABS_LIST } from "constants/dashboard";

export const TabsList = () => (
  <Tab.List
    as="div"
    className="border-[0.5px] border-neutral-border-medium rounded grid grid-cols-3 bg-neutral-component-surface-dark"
  >
    {ISSUES_TABS_LIST.map((tab) => (
      <Tab
        key={tab.key}
        className={({ selected }) =>
          cn("font-semibold text-xs rounded py-1.5 focus:outline-none", {
            "bg-neutral-component-surface-light text-custom-text-300 shadow-[2px_0_8px_rgba(167,169,174,0.15)]":
              selected,
            "text-custom-text-400": !selected,
          })
        }
      >
        {tab.label}
      </Tab>
    ))}
  </Tab.List>
);
