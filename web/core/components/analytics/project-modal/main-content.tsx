import React, { Fragment } from "react";
import { observer } from "mobx-react";
import { Tab } from "@headlessui/react";
// plane package imports
import { ANALYTICS_TABS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ICycle, IModule, IProject } from "@plane/types";
// components
import { CustomAnalytics, ScopeAndDemand } from "@/components/analytics";

type Props = {
  fullScreen: boolean;
  cycleDetails: ICycle | undefined;
  moduleDetails: IModule | undefined;
  projectDetails: IProject | undefined;
};

export const ProjectAnalyticsModalMainContent: React.FC<Props> = observer((props) => {
  const { fullScreen, cycleDetails, moduleDetails } = props;
  const { t } = useTranslation();
  return (
    <Tab.Group as={React.Fragment}>
      <Tab.List as="div" className="flex space-x-2 border-b h-[50px] border-custom-border-200 px-0 md:px-3">
        {ANALYTICS_TABS.map((tab) => (
          <Tab key={tab.key} as={Fragment}>
            {({ selected }) => (
              <button
                className={`text-sm group relative flex items-center gap-1 h-[50px] px-3 cursor-pointer transition-all font-medium outline-none  ${
                  selected ? "text-custom-primary-100 " : "hover:text-custom-text-200"
                }`}
              >
                {t(tab.i18n_title)}
                <div
                  className={`border absolute bottom-0 right-0 left-0 rounded-t-md ${selected ? "border-custom-primary-100" : "border-transparent group-hover:border-custom-border-200"}`}
                />
              </button>
            )}
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
