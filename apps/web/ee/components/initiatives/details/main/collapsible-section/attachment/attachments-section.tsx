"use client";
import React from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// plane web
import { CollapsibleDetailSection } from "@/plane-web/components/common/layout/main/sections/collapsible-root";
// local imports
import { InitiativeAttachmentActionButton } from "../../info-section/attachment-button";
import { InitiativeAttachmentRoot } from "../attachment";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
  isOpen: boolean;
  onToggle: () => void;
  count: number;
};

export const AttachmentsSection: React.FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled, isOpen, onToggle, count } = props;
  const { t } = useTranslation();

  return (
    <CollapsibleDetailSection
      title={t("common.attachments")}
      actionItemElement={
        !disabled && (
          <div className="pb-3">
            <InitiativeAttachmentActionButton
              workspaceSlug={workspaceSlug}
              initiativeId={initiativeId}
              disabled={disabled}
            />
          </div>
        )
      }
      count={count}
      collapsibleContent={
        <InitiativeAttachmentRoot workspaceSlug={workspaceSlug} initiativeId={initiativeId} disabled={disabled} />
      }
      isOpen={isOpen}
      onToggle={onToggle}
    />
  );
});
