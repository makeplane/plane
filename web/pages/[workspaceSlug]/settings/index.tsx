import { ReactElement } from "react";
import { observer } from "mobx-react";
// layouts
import { PageHead } from "@/components/core";
import { WorkspaceSettingHeader } from "@/components/headers";
import { WorkspaceDetails } from "@/components/workspace";
import { useWorkspace } from "@/hooks/store";
import { AppLayout } from "@/layouts/app-layout";
import { WorkspaceSettingLayout } from "@/layouts/settings-layout";
// hooks
// components
// types
import { NextPageWithLayout } from "@/lib/types";

const WorkspaceSettingsPage: NextPageWithLayout = observer(() => {
  // store hooks
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - General Settings` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <WorkspaceDetails />
    </>
  );
});

WorkspaceSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default WorkspaceSettingsPage;
