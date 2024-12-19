"use client";

import React, { FC, useState } from "react";
import { observer } from "mobx-react";
// Plane
import { Collapsible } from "@plane/ui";
// Plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
//
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

  // store hooks
  const {
    initiative: { getInitiativeById },
  } = useInitiatives();

  // derived values
  const initiative = getInitiativeById(initiativeId);

  const projectsIds = initiative?.project_ids;

  if (!projectsIds) return <></>;

  return (
    <Collapsible
      isOpen={isOpen}
      onToggle={() => setIsOpen((prevState) => !prevState)}
      title={<InitiativeProjectsCollapsibleTitle isOpen={isOpen} projectsIds={projectsIds} disabled={disabled} />}
      buttonClassName="w-full"
    >
      <InitiativeProjectsCollapsibleContent
        workspaceSlug={workspaceSlug}
        projectIds={projectsIds}
        initiativeId={initiativeId}
        disabled={disabled}
      />
    </Collapsible>
  );
});
