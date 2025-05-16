import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Tab } from "@headlessui/react";
// plane package imports
import { ICycle, IModule, IProject } from "@plane/types";
import { Spinner } from "@plane/ui";
// hooks
import { useAnalyticsV2 } from "@/hooks/store";
// plane web components
import TotalInsights from "../../total-insights";
import CreatedVsResolved from "../created-vs-resolved";
import CustomizedInsights from "../customized-insights";
import WorkItemsInsightTable from "../workitems-insight-table";

type Props = {
  fullScreen: boolean;
  projectDetails: IProject | undefined;
  cycleDetails: ICycle | undefined;
  moduleDetails: IModule | undefined;
};

export const WorkItemsModalMainContent: React.FC<Props> = observer((props) => {
  const { projectDetails, cycleDetails, moduleDetails, fullScreen } = props;
  const { updateSelectedProjects, updateSelectedCycle, updateSelectedModule } = useAnalyticsV2();
  const [isModalConfigured, setIsModalConfigured] = useState(false);

  useEffect(() => {
    // Handle project selection
    if (projectDetails?.id) {
      updateSelectedProjects([projectDetails.id]);
    }

    // Handle cycle selection
    if (cycleDetails?.id) {
      updateSelectedCycle(cycleDetails.id);
    }

    // Handle module selection
    if (moduleDetails?.id) {
      updateSelectedModule(moduleDetails.id);
    }
    setIsModalConfigured(true);

    // Cleanup fields
    return () => {
      updateSelectedProjects([]);
      updateSelectedCycle("");
      updateSelectedModule("");
    };
  }, [
    projectDetails?.id,
    cycleDetails?.id,
    moduleDetails?.id,
    updateSelectedProjects,
    updateSelectedCycle,
    updateSelectedModule,
  ]);

  if (!isModalConfigured)
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );

  return (
    <Tab.Group as={React.Fragment}>
      <div className="flex flex-col gap-14 overflow-y-auto p-6">
        <TotalInsights analyticsType="work-items" peekView={!fullScreen} />
        <CreatedVsResolved />
        <CustomizedInsights peekView={!fullScreen} />
        <WorkItemsInsightTable />
      </div>
    </Tab.Group>
  );
});
