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

import { Button } from "@plane/propel/button";
import { LabelFilledIcon } from "@plane/propel/icons";

export type LabelChipProps = {
  name?: string;
  color?: string;
};

export function LabelChip(props: LabelChipProps) {
  const { name, color } = props;
  if (!name) return null;
  return (
    <Button variant="tertiary" size="base" prependIcon={<LabelFilledIcon color={color} />}>
      {name}
    </Button>
  );
}
