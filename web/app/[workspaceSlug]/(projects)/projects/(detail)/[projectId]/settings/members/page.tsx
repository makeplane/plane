"use client";

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core";
import { ProjectMemberList, ProjectSettingsMemberDefaults } from "@/components/project";
// hooks
import { useProject } from "@/hooks/store";

const MembersSettingsPage = observer(() => {
  // store
  const { currentProjectDetails } = useProject();
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Members` : undefined;

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
