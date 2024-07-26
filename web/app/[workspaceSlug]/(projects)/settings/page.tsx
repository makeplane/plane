"use client";

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core";
import { WorkspaceDetails } from "@/components/workspace";
// hooks
import { useWorkspace } from "@/hooks/store";

const WorkspaceSettingsPage = observer(() => {
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

export default WorkspaceSettingsPage;
