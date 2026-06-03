/* eslint-disable react-refresh/only-export-components -- route page with mobx observer export */
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { PageHead } from "@/components/core/page-title";
import { useProject } from "@/hooks/store/use-project";
import { ProjectSettingsCustomFields } from "@/plane-web/components/issues/custom-fields/project-settings-custom-fields";

function CustomFieldsSettingsPage() {
  const { workspaceSlug, projectId } = useParams<{
    workspaceSlug: string;
    projectId: string;
  }>();
  const { currentProjectDetails } = useProject();

  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails.name} - Custom fields` : "Custom fields";

  if (!workspaceSlug || !projectId) return null;

  return (
    <>
      <PageHead title={pageTitle} />
      <ProjectSettingsCustomFields workspaceSlug={workspaceSlug} projectId={projectId} />
    </>
  );
}

export default observer(CustomFieldsSettingsPage);
