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

// local imports
import { LinkList } from "../link-items";
import { useLinkOperations } from "../link-items/links-helper";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  permissions: {
    canEdit: (linkId: string) => boolean;
    canDelete: (linkId: string) => boolean;
  };
};

export function InitiativeLinksCollapsibleContent(props: Props) {
  const { workspaceSlug, initiativeId, permissions } = props;
  // helper
  const handleLinkOperations = useLinkOperations(workspaceSlug, initiativeId);
  return <LinkList initiativeId={initiativeId} linkOperations={handleLinkOperations} permissions={permissions} />;
}
