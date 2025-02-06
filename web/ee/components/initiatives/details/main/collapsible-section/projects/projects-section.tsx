"use client";
import React from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// plane web
import { CollapsibleDetailSection } from "@/plane-web/components/common/layout/main/sections/collapsible-root";
// local components
import { InitiativeProjectsCollapsibleContent } from "./content";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  projectIds: string[] | null | undefined;
  disabled: boolean;
  toggleProjectModal: (value?: boolean) => void;
  isOpen: boolean;
  onToggle: () => void;
  count: number;
};

export const ProjectsSection: React.FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, projectIds, disabled, toggleProjectModal, isOpen, onToggle, count } = props;
  const { t } = useTranslation();

  return (
    <CollapsibleDetailSection
      title={t("common.projects")}
      actionItemElement={
        !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggleProjectModal(true);
            }}
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
          </button>
        )
      }
      count={count}
      collapsibleContent={
        <InitiativeProjectsCollapsibleContent
          workspaceSlug={workspaceSlug}
          projectIds={projectIds}
          initiativeId={initiativeId}
          disabled={disabled}
          toggleProjectModal={toggleProjectModal}
        />
      }
      isOpen={isOpen}
      onToggle={onToggle}
    />
  );
});
