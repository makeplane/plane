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

import { observer } from "mobx-react";
// hooks
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
// store
import type { PermissionCheckArgs } from "@plane/types";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
} & PermissionCheckArgs;

export const PermissionWrapper = observer(function PermissionWrapper({ children, fallback = null, ...rest }: Props) {
  // store hooks
  const { can } = usePermissionAccess();
  // derived values
  const isPermissionGranted = can(rest);

  return isPermissionGranted ? <>{children}</> : <>{fallback}</>;
});
