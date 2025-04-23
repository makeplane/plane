"use client";

import { observer } from "mobx-react";
// components
import { useParams } from "next/navigation";
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core";
import { useProject } from "@/hooks/store";

const ProjectSettingsPage = observer(() => {
  // store hooks
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { currentProjectDetails, fetchProjectDetails } = useProject();
  const { t } = useTranslation();
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - General Settings` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
    </>
  );
});

export default ProjectSettingsPage;
