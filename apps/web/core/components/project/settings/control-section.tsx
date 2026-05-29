import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// plane imports
import { PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// components
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
// hooks
import { useProject } from "@/hooks/store/use-project";
// local imports
import { ArchiveRestoreProjectModal } from "../archive-restore-modal";
import { DeleteProjectModal } from "../delete-project-modal";

type Props = {
  projectId: string;
};

export const GeneralProjectSettingsControlSection = observer(function GeneralProjectSettingsControlSection(
  props: Props
) {
  const { projectId } = props;
  // states
  const [selectProject, setSelectedProject] = useState<string | null>(null);
  const [archiveProject, setArchiveProject] = useState<boolean>(false);
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { currentProjectDetails } = useProject();
  // translation
  const { t } = useTranslation();

  if (!currentProjectDetails) return null;

  return (
    <div className="mt-10">
      {workspaceSlug && (
        <ArchiveRestoreProjectModal
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          isOpen={archiveProject}
          onClose={() => setArchiveProject(false)}
          archive
        />
      )}
      <DeleteProjectModal
        project={currentProjectDetails}
        isOpen={Boolean(selectProject)}
        onClose={() => setSelectedProject(null)}
      />
      <div className="rounded-lg border border-subtle bg-layer-2">
        {/* Project Selector */}
        <SettingsBoxedControlItem
          className="rounded-b-none border-0 border-b"
          title={t("archive")}
          description="Archiving a project will unlist your project from your side navigation although you will still be able to access it from your projects page. You can restore the project or delete it whenever you want."
          control={
            <Button variant="secondary" onClick={() => setArchiveProject(true)}>
              {t("archive")}
            </Button>
          }
        />
        {/* Format Selector */}
        <SettingsBoxedControlItem
          className="rounded-t-none border-0"
          title={t("delete")}
          description="When deleting a project, all of the data and resources within that project will be permanently removed and cannot be recovered."
          control={
            <Button
              variant="error-outline"
              onClick={() => setSelectedProject(currentProjectDetails.id ?? null)}
              data-ph-element={PROJECT_TRACKER_ELEMENTS.DELETE_PROJECT_BUTTON}
            >
              {t("delete")}
            </Button>
          }
        />
      </div>
    </div>
  );
});
