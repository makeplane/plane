"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// ui
import { Button, getButtonStyling, Row } from "@plane/ui";
// components
import { Logo } from "@/components/common";
import { ProjectFeaturesList } from "@/components/project/settings";
// hooks
import { useProject } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string | null;
  onClose: () => void;
};

export const ProjectFeatureUpdate: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, onClose } = props;
  // store hooks
  const { getProjectById } = useProject();

  if (!workspaceSlug || !projectId) return null;
  const currentProjectDetails = getProjectById(projectId);
  if (!currentProjectDetails) return null;

  return (
    <>
      <Row className="py-6">
        <ProjectFeaturesList workspaceSlug={workspaceSlug} projectId={projectId} isAdmin />
      </Row>
      <div className="flex items-center justify-between gap-2 mt-4 px-6 py-4 border-t border-custom-border-100">
        <div className="flex gap-1 text-sm text-custom-text-300 font-medium">
          Congrats! Project <Logo logo={currentProjectDetails.logo_props} />{" "}
          <p className="break-all">{currentProjectDetails.name}</p> created.
        </div>
        <div className="flex gap-2">
          <Button variant="neutral-primary" size="sm" onClick={onClose} tabIndex={1}>
            Close
          </Button>
          <Link
            href={`/${workspaceSlug}/projects/${projectId}/issues`}
            onClick={onClose}
            className={getButtonStyling("primary", "sm")}
            tabIndex={2}
          >
            Open project
          </Link>
        </div>
      </div>
    </>
  );
});
