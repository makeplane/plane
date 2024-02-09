import React from "react";
import { observer } from "mobx-react-lite";
import { Tab } from "@headlessui/react";
// components
import { CustomAnalytics, ScopeAndDemand } from "components/analytics";
// types
import { ICycle, IModule, IProject } from "@plane/types";
// constants
import { ANALYTICS_TABS } from "constants/analytics";

type Props = {
  fullScreen: boolean;
  cycleDetails: ICycle | undefined;
  moduleDetails: IModule | undefined;
  projectDetails: IProject | undefined;
};

export const ProjectAnalyticsModalMainContent: React.FC<Props> = observer((props) => {
  const { fullScreen, cycleDetails, moduleDetails } = props;

  return (
    <Tab.Group as={React.Fragment}>
      <Tab.List as="div" className="flex space-x-2 border-b border-neutral-border-medium px-0 md:px-5 py-0 md:py-3">
        {ANALYTICS_TABS.map((tab) => (
          <Tab
            key={tab.key}
            className={({ selected }) =>
              `rounded-0 w-full md:w-max md:rounded-3xl border-b md:border border-neutral-border-medium focus:outline-none px-0 md:px-4 py-2 text-xs hover:bg-neutral-component-surface-dark ${
                selected
                  ? "border-primary-border-subtle text-primary-text-subtle md:bg-neutral-component-surface-dark md:text-neutral-text-medium md:border-neutral-border-medium"
                  : "border-transparent"
              }`
            }
            onClick={() => {}}
          >
            {tab.title}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels as={React.Fragment}>
        <Tab.Panel as={React.Fragment}>
          <ScopeAndDemand fullScreen={fullScreen} />
        </Tab.Panel>
        <Tab.Panel as={React.Fragment}>
          <CustomAnalytics
            additionalParams={{
              cycle: cycleDetails?.id,
              module: moduleDetails?.id,
            }}
            fullScreen={fullScreen}
          />
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
});
