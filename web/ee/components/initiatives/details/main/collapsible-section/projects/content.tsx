"use client";

import React, { FC } from "react";
//
import { Briefcase } from "lucide-react";
import { getButtonStyling } from "@plane/ui";
import { cn } from "@plane/utils";
import { SectionEmptyState } from "@/plane-web/components/common";
import { ProjectList } from "./project-list";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  projectIds: string[] | null | undefined;
  disabled: boolean;
  toggleProjectModal: (value?: boolean) => void;
};

export const InitiativeProjectsCollapsibleContent: FC<Props> = (props) => {
  const { workspaceSlug, initiativeId, projectIds, disabled, toggleProjectModal } = props;
  return (
    <div className="mt-3">
      {projectIds && projectIds?.length > 0 ? (
        <ProjectList
          workspaceSlug={workspaceSlug}
          initiativeId={initiativeId}
          projectIds={projectIds}
          disabled={disabled}
        />
      ) : (
        <>
          <SectionEmptyState
            heading="No projects yet"
            subHeading="Start adding projects to manage and track the progress."
            icon={<Briefcase className="size-4" />}
            actionElement={
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  toggleProjectModal(true);
                }}
                disabled={disabled}
              >
                <span className={cn(getButtonStyling("accent-primary", "sm"), "font-medium px-2 py-1")}>
                  Add projects
                </span>
              </button>
            }
          />
        </>
      )}
    </div>
  );
};
