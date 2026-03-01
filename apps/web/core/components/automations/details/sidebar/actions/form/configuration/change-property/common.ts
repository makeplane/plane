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

import { cn } from "@plane/utils";

export const getPropertyChangeDropdownClassNames = (isDisabled: boolean) => {
  const dropdownButtonClassName = cn("w-full px-4 py-1.5 hover:bg-layer-transparent-hover", {
    "bg-layer-disabled": isDisabled,
  });
  const errorClassName = "border-[0.5px] border-danger-strong";

  return {
    dropdownButtonClassName,
    errorClassName,
  };
};
