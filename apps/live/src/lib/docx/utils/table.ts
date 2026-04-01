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

import { WidthType } from "docx";

export const pxToDxa = (px: number): number => Math.round(px * 0.75 * 20);

export const cellWidth = (px: number) => ({
  size: pxToDxa(px),
  type: WidthType.DXA,
});

export const FULL_TABLE_WIDTH = {
  size: 100,
  type: WidthType.PERCENTAGE,
};
