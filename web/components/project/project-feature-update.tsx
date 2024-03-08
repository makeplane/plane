import React, { FC } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// hooks
import { useProject } from "hooks/store";
// ui
import { Button } from "@plane/ui";
// components
import { ProjectFeaturesList } from "./settings";
import { ProjectLogo } from "./project-logo";

type Props = {
  workspaceSlug: string;
  projectId: string | null;
  onClose: () => void;
};

export const ProjectFeatureUpdate: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, onClose } = props;
  // router
  const router = useRouter();
  // store hooks
  const { getProjectById } = useProject();

  if (!workspaceSlug || !projectId) return null;
  const currentProjectDetails = getProjectById(projectId);
  if (!currentProjectDetails) return null;

  const handleProjectRedirect = () => {
    router.push(`/${workspaceSlug}/projects/${projectId}/issues`);
    onClose();
  };

  return (
    <>
      <div className="px-4 py-2">
        <h3 className="text-base font-medium leading-6">Toggle project features</h3>
        <div className="text-sm tracking-tight text-custom-text-200 leading-5">
          Turn on features which help you manage and run your project.
        </div>
      </div>
      <ProjectFeaturesList workspaceSlug={workspaceSlug} projectId={projectId} isAdmin />
      <div className="flex items-center justify-between gap-2 mt-4 px-4 pt-4 pb-2 border-t border-custom-border-100">
        <div className="text-sm text-custom-text-300 font-medium">
          Congrats! Project <ProjectLogo logo={currentProjectDetails.logo_props} /> {currentProjectDetails.name}{" "}
          created.
        </div>
        <div className="flex gap-2">
          <Button variant="neutral-primary" size="sm" onClick={onClose} tabIndex={1}>
            Close
          </Button>
          <Button variant="primary" onClick={handleProjectRedirect} size="sm" tabIndex={2}>
            Open project
          </Button>
        </div>
      </div>
    </>
  );
});
