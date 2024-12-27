"use client";

import React, { FC, useState } from "react";
import { observer } from "mobx-react";
// Plane
import { Collapsible, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { ProjectMultiSelectModal } from "@/components/project";
// hooks
import { useProject } from "@/hooks/store";
// Plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local components
import { InitiativeProjectsCollapsibleContent } from "./content";
import { InitiativeProjectsCollapsibleTitle } from "./title";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};

export const ProjectsCollapsible: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled = false } = props;
  // store hooks
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    initiative: { getInitiativeById, updateInitiative },
  } = useInitiatives();
  const { workspaceProjectIds } = useProject();

  // derived values
  const initiative = getInitiativeById(initiativeId);

  const projectsIds = initiative?.project_ids;

  if (!projectsIds) return <></>;

  const handleOnClick = () => {
    setIsModalOpen(true);
  };

  const handleProjectsUpdate = async (initiativeProjectIds: string[]) => {
    if (!initiativeId) return;

    if (initiativeProjectIds.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select at least one project.",
      });
      return;
    }

    await updateInitiative(workspaceSlug?.toString(), initiativeId, { project_ids: initiativeProjectIds })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Initiative projects updated successfully.`,
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? `Failed to update initiative projects. Please try again!`,
        });
      });
  };

  return (
    <>
      <ProjectMultiSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleProjectsUpdate}
        selectedProjectIds={projectsIds}
        projectIds={workspaceProjectIds || []}
      />
      <Collapsible
        isOpen={isOpen}
        onToggle={() => setIsOpen((prevState) => !prevState)}
        title={
          <InitiativeProjectsCollapsibleTitle
            isOpen={isOpen}
            projectsIds={projectsIds}
            disabled={disabled}
            handleOnClick={handleOnClick}
          />
        }
        buttonClassName="w-full"
      >
        <InitiativeProjectsCollapsibleContent
          workspaceSlug={workspaceSlug}
          projectIds={projectsIds}
          initiativeId={initiativeId}
          disabled={disabled}
        />
      </Collapsible>
    </>
  );
});
