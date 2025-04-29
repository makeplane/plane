"use client";
import React from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// plane web
import { CollapsibleDetailSection } from "@/plane-web/components/common/layout/main/sections/collapsible-root";
// local imports
import { InitiativeLinksActionButton } from "../../info-section/link-button";
import { InitiativeLinksCollapsibleContent } from "./link-components/content";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
  isOpen: boolean;
  onToggle: () => void;
  count: number;
};

export const LinksSection: React.FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled, isOpen, onToggle, count } = props;
  const { t } = useTranslation();

  return (
    <CollapsibleDetailSection
      title={t("common.links")}
      actionItemElement={!disabled && <InitiativeLinksActionButton disabled={disabled} />}
      count={count}
      collapsibleContent={
        <InitiativeLinksCollapsibleContent
          workspaceSlug={workspaceSlug}
          initiativeId={initiativeId}
          disabled={disabled}
        />
      }
      isOpen={isOpen}
      onToggle={onToggle}
    />
  );
});
