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

import { EPillVariant, EPillSize, ERadius, Pill } from "@plane/propel/pill";
import { generateIconColors } from "@plane/utils";

export function BetaBadge() {
  const color = generateIconColors("CC7700");
  const textColor = color ? color.foreground : "transparent";
  const backgroundColor = color ? color.background : "transparent";
  return (
    <Pill
      variant={EPillVariant.WARNING}
      size={EPillSize.SM}
      radius={ERadius.SQUARE}
      className="border-none "
      style={{ color: textColor, backgroundColor: backgroundColor }}
    >
      Beta
    </Pill>
  );
}
