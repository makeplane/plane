"use client";
import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
// Plane
import { CollapsibleButton } from "@plane/ui";
// components
import { IssueLinksActionButton } from "@/components/issues/issue-detail-widgets";
// hooks
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { InitiativeAttachmentActionButton } from "./quick-action-button";

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  initiativeId: string;
  disabled: boolean;
};

export const InitiativeAttachmentsCollapsibleTitle: FC<Props> = observer((props) => {
  const { workspaceSlug, isOpen, initiativeId, disabled } = props;

  // store hooks
  const {
    initiative: {
      initiativeAttachments: { getAttachmentsByInitiativeId },
    },
  } = useInitiatives();

  // derived values
  const initiativeAttachments = getAttachmentsByInitiativeId(initiativeId);

  const attachmentsCount = initiativeAttachments?.length ?? 0;

  // indicator element
  const indicatorElement = useMemo(
    () => (
      <span className="flex items-center justify-center ">
        <p className="text-base text-custom-text-300 !leading-3">{attachmentsCount}</p>
      </span>
    ),
    [attachmentsCount]
  );

  return (
    <CollapsibleButton
      isOpen={isOpen}
      title="Attachments"
      indicatorElement={indicatorElement}
      actionItemElement={
        !disabled && (
          <InitiativeAttachmentActionButton
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            disabled={disabled}
          />
        )
      }
    />
  );
});
