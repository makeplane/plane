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

import type { FC } from "react";
import React from "react";
// components
import { LinkList } from "../link-items";
// helper
import { useLinkOperations } from "../link-items/links-helper";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
};

export function InitiativeLinksCollapsibleContent(props: Props) {
  const { workspaceSlug, initiativeId, disabled } = props;
  // helper
  const handleLinkOperations = useLinkOperations(workspaceSlug, initiativeId);
  return <LinkList initiativeId={initiativeId} linkOperations={handleLinkOperations} disabled={disabled} />;
}
