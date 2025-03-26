"use client";
import React from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// plane web
import { CollapsibleDetailSection } from "@/plane-web/components/common/layout/main/sections/collapsible-root";
// local components
import { InitiativeEpicsCollapsibleContent } from "./content";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
  toggleEpicModal: (value?: boolean) => void;
  isOpen: boolean;
  onToggle: () => void;
  count: number;
};

export const EpicsSection: React.FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled, toggleEpicModal, isOpen, onToggle, count } = props;
  const { t } = useTranslation();

  return (
    <CollapsibleDetailSection
      title={t("common.epics")}
      actionItemElement={
        !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggleEpicModal();
            }}
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
          </button>
        )
      }
      count={count}
      collapsibleContent={
        <InitiativeEpicsCollapsibleContent
          workspaceSlug={workspaceSlug}
          initiativeId={initiativeId}
          toggleEpicModal={toggleEpicModal}
          disabled={disabled}
        />
      }
      isOpen={isOpen}
      onToggle={onToggle}
    />
  );
});
