"use client";
import React from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// plane web
import { CollapsibleDetailSection } from "@/plane-web/components/common/layout/main/sections/collapsible-root";
// local components
import { InitiativeEpicsCollapsibleContent } from "./content";
import { EpicsTitleActions } from "./title-actions";

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
        <EpicsTitleActions
          disabled={disabled}
          toggleEpicModal={toggleEpicModal}
          initiativeId={initiativeId}
          workspaceSlug={workspaceSlug}
        />
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
