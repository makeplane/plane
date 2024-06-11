"use client";

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core";
import { ProjectSettingStateList } from "@/components/states";
// hook
import { useProject } from "@/hooks/store";

const StatesSettingsPage = observer(() => {
  // store
  const { currentProjectDetails } = useProject();
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - States` : undefined;
  return (
    <>
      <PageHead title={pageTitle} />
      <div className="w-full gap-10 overflow-y-auto py-8 pr-9">
        <div className="flex items-center border-b border-custom-border-100 py-3.5">
          <h3 className="text-xl font-medium">States</h3>
        </div>
        <ProjectSettingStateList />
      </div>
    </>
  );
});

export default StatesSettingsPage;
