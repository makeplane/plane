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

import { useMemo } from "react";
import type { TContextMenuItem } from "@plane/ui";
import type { MenuItemFactoryProps } from "@/components/issues/issue-layouts/quick-action-dropdowns/helper";
import { useMenuItemFactory } from "@/components/issues/issue-layouts/quick-action-dropdowns/helper";

export const useEpicMenuItems = (props: MenuItemFactoryProps): TContextMenuItem[] => {
  const factory = useMenuItemFactory(props);

  return useMemo(
    () => [
      factory.createEditMenuItem(),
      factory.createCopyMenuItem(props.workspaceSlug),
      factory.createOpenInNewTabMenuItem(),
      factory.createCopyLinkMenuItem(),
      factory.createArchiveMenuItem(),
      factory.createRestoreMenuItem(),
      factory.createDeleteMenuItem(),
    ],
    [factory, props.workspaceSlug]
  );
};

export const useArchivedEpicMenuItems = (props: MenuItemFactoryProps): TContextMenuItem[] => {
  const factory = useMenuItemFactory(props);

  return useMemo(
    () => [factory.createRestoreMenuItem(), factory.createOpenInNewTabMenuItem(), factory.createCopyLinkMenuItem()],
    [factory, props.workspaceSlug]
  );
};
