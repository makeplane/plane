/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import React from "react";
import { observer } from "mobx-react";
// hooks
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// components
import { AttachmentsSection } from "./collapsible-section/attachment/attachments-section";
import { LinksSection } from "./collapsible-section/links/links-section";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  permissions: {
    canAddLink: boolean;
    canEditLink: boolean;
    canDeleteLink: boolean;
    canAddAttachment: boolean;
    canDeleteAttachment: (attachmentId: string) => boolean;
    canRemoveProject: boolean;
    canRemoveEpic: boolean;
  };
};

export const InitiativeCollapsibleSection = observer(function InitiativeCollapsibleSection(props: Props) {
  const { workspaceSlug, initiativeId, permissions } = props;
  // store hooks
  const {
    initiative: {
      initiativeLinks: { getInitiativeLinks },
      initiativeAttachments: { getAttachmentsByInitiativeId },
      openCollapsibleSection,
      toggleOpenCollapsibleSection,
    },
  } = useInitiatives();
  // derived values
  const initiativesLinks = getInitiativeLinks(initiativeId);
  const attachmentUploads = getAttachmentsByInitiativeId(initiativeId);
  const initiativesAttachments = getAttachmentsByInitiativeId(initiativeId);

  const shouldRenderLinks = !!initiativesLinks && initiativesLinks?.length > 0;
  const shouldRenderAttachments =
    (!!initiativesAttachments && initiativesAttachments?.length > 0) ||
    (!!attachmentUploads && attachmentUploads.length > 0);

  const linksCount = initiativesLinks?.length ?? 0;
  const attachmentCount = initiativesAttachments?.length ?? 0;

  const sectionOrder = ["links", "attachments"];

  const renderSection = (sectionType: string) => {
    switch (sectionType) {
      case "links":
        return (
          shouldRenderLinks && (
            <LinksSection
              workspaceSlug={workspaceSlug}
              initiativeId={initiativeId}
              isOpen={openCollapsibleSection.includes("links")}
              onToggle={() => toggleOpenCollapsibleSection("links")}
              count={linksCount}
              permissions={{
                canCreate: permissions.canAddLink,
                canEdit: () => permissions.canEditLink,
                canDelete: () => permissions.canDeleteLink,
              }}
            />
          )
        );
      case "attachments":
        return (
          shouldRenderAttachments && (
            <AttachmentsSection
              workspaceSlug={workspaceSlug}
              initiativeId={initiativeId}
              permissions={{
                canCreate: permissions.canAddAttachment,
                canEdit: () => false, // no edit UI for attachments
                canDelete: (attachmentId) => permissions.canDeleteAttachment(attachmentId),
              }}
              isOpen={openCollapsibleSection.includes("attachments")}
              onToggle={() => toggleOpenCollapsibleSection("attachments")}
              count={attachmentCount}
            />
          )
        );
      default:
        return null;
    }
  };

  return (
    <>
      {sectionOrder.map((sectionType) => (
        <React.Fragment key={sectionType}>{renderSection(sectionType)}</React.Fragment>
      ))}
    </>
  );
});
