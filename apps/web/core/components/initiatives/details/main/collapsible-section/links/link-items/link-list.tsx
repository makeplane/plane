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
import { observer } from "mobx-react";
// PLane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
//
import { InitiativeLinkItem } from "./link-item";
import type { TLinkOperations } from "./root";

export type TLinkOperationsModal = Exclude<TLinkOperations, "create">;

type TLinkList = {
  initiativeId: string;
  linkOperations: TLinkOperationsModal;
  disabled?: boolean;
};

export const LinkList = observer(function LinkList(props: TLinkList) {
  // props
  const { initiativeId, linkOperations, disabled = false } = props;
  // hooks
  const {
    initiative: {
      initiativeLinks: { getInitiativeLinks },
    },
  } = useInitiatives();

  const links = getInitiativeLinks(initiativeId);

  if (!links) return null;

  return (
    <div className="flex flex-col gap-2 py-4">
      {links.map((link) => (
        <InitiativeLinkItem key={link.id} link={link} linkOperations={linkOperations} isNotAllowed={disabled} />
      ))}
    </div>
  );
});
