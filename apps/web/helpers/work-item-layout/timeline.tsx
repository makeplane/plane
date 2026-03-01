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

import type { CSSProperties } from "react";
import { renderFormattedDate } from "@plane/utils";

/**
 * This Method is used to get Block view details, that returns block style and tooltip message
 * @param block
 * @param backgroundColor
 * @returns
 */
export const getBlockViewDetails = (
  block: { start_date: string | undefined | null; target_date: string | undefined | null } | undefined | null,
  backgroundColor: string
) => {
  const isBlockVisibleOnChart = block?.start_date || block?.target_date;
  const isBlockComplete = block?.start_date && block?.target_date;

  let message;
  const blockStyle: CSSProperties = {
    backgroundColor,
  };

  if (isBlockVisibleOnChart && !isBlockComplete) {
    if (block?.start_date) {
      message = `From ${renderFormattedDate(block.start_date)}`;
      blockStyle.maskImage = `linear-gradient(to right, ${backgroundColor} 50%, transparent 95%)`;
    } else if (block?.target_date) {
      message = `Till ${renderFormattedDate(block.target_date)}`;
      blockStyle.maskImage = `linear-gradient(to left, ${backgroundColor} 50%, transparent 95%)`;
    }
  } else if (isBlockComplete) {
    message = `${renderFormattedDate(block?.start_date)} to ${renderFormattedDate(block?.target_date)}`;
  }

  return {
    message,
    blockStyle,
  };
};
