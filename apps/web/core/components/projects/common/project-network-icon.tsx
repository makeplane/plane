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

import type { TNetworkChoiceIconKey } from "@plane/constants";
// plane imports
import { GlobeIcon, LockIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";

type Props = {
  iconKey: TNetworkChoiceIconKey;
  className?: string;
};

export function ProjectNetworkIcon(props: Props) {
  const { iconKey, className } = props;
  // Get the icon key
  const getProjectNetworkIcon = () => {
    switch (iconKey) {
      case "Lock":
        return LockIcon;
      case "Globe2":
        return GlobeIcon;
      default:
        return null;
    }
  };

  // Get the icon
  const Icon = getProjectNetworkIcon();
  if (!Icon) return null;

  return <Icon className={cn("h-3 w-3", className)} />;
}
