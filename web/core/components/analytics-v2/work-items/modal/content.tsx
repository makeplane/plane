import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Tab } from "@headlessui/react";
// plane package imports
import { IProject } from "@plane/types";
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
};

export const WorkItemsModalMainContent: React.FC<Props> = observer((props) => {
  const { projectDetails, fullScreen } = props;
  const { updateSelectedProjects } = useAnalyticsV2();
  const [isProjectConfigured, setIsProjectConfigured] = useState(false);

  useEffect(() => {
    if (!projectDetails?.id) return;
    updateSelectedProjects([projectDetails?.id ?? ""]);
    setIsProjectConfigured(true);
  }, [projectDetails?.id, updateSelectedProjects]);

  if (!isProjectConfigured)
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
