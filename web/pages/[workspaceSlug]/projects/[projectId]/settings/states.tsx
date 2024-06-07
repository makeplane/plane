import { ReactElement } from "react";
import { observer } from "mobx-react";
// layout
import { PageHead } from "@/components/core";
import { ProjectSettingHeader } from "@/components/headers";
import { ProjectSettingStateList } from "@/components/states";
import { useProject } from "@/hooks/store";
import { AppLayout } from "@/layouts/app-layout";
import { ProjectSettingLayout } from "@/layouts/settings-layout";
// components
// types
import { NextPageWithLayout } from "@/lib/types";
// hook

const StatesSettingsPage: NextPageWithLayout = observer(() => {
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

StatesSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout withProjectWrapper header={<ProjectSettingHeader />}>
      <ProjectSettingLayout>{page}</ProjectSettingLayout>
    </AppLayout>
  );
};

export default StatesSettingsPage;
