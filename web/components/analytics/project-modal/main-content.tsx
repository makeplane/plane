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
      <Tab.List as="div" className="space-x-2 border-b border-custom-border-200 p-5 pt-0">
        {ANALYTICS_TABS.map((tab) => (
          <Tab
            key={tab.key}
            className={({ selected }) =>
              `rounded-3xl border border-custom-border-200 px-4 py-2 text-xs hover:bg-custom-background-80 ${
                selected ? "bg-custom-background-80" : ""
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
