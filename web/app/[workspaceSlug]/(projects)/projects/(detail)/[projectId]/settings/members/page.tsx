"use client";

import { observer } from "mobx-react";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import { ProjectMemberList, ProjectSettingsMemberDefaults } from "@/components/project";
// hooks
import { useProject, useUser } from "@/hooks/store";

const MembersSettingsPage = observer(() => {
  // store
  const { currentProjectDetails } = useProject();
  const {
    canPerformProjectViewerActions,
    membership: { currentProjectRole },
  } = useUser();
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Members` : undefined;

  if (currentProjectRole && !canPerformProjectViewerActions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <section className={`w-full overflow-y-auto py-8 pr-9`}>
        <ProjectSettingsMemberDefaults />
        <ProjectMemberList />
      </section>
    </>
  );
});

export default MembersSettingsPage;
