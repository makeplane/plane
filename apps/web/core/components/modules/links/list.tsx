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

import { useCallback } from "react";
import { observer } from "mobx-react";
// plane types
import type { ILinkDetails } from "@plane/types";
// components
import { ModulesLinksListItem } from "@/components/modules";
// hooks
import { useModule } from "@/hooks/store/use-module";

type Props = {
  handleDeleteLink: (linkId: string) => void;
  handleEditLink: (link: ILinkDetails) => void;
  moduleId: string;
  permissions: {
    canEdit: (linkId: string) => boolean;
    canDelete: (linkId: string) => boolean;
  };
};

export const ModuleLinksList = observer(function ModuleLinksList(props: Props) {
  const { moduleId, handleDeleteLink, handleEditLink, permissions } = props;
  // store hooks
  const { getModuleById } = useModule();
  // derived values
  const currentModule = getModuleById(moduleId);
  const moduleLinks = currentModule?.link_module;
  // memoized link handlers
  const memoizedDeleteLink = useCallback((id: string) => handleDeleteLink(id), [handleDeleteLink]);
  const memoizedEditLink = useCallback((link: ILinkDetails) => handleEditLink(link), [handleEditLink]);

  if (!moduleLinks) return null;

  return (
    <>
      {moduleLinks.map((link) => (
        <ModulesLinksListItem
          key={link.id}
          handleDeleteLink={() => memoizedDeleteLink(link.id)}
          handleEditLink={() => memoizedEditLink(link)}
          permissions={permissions}
          link={link}
        />
      ))}
    </>
  );
});
