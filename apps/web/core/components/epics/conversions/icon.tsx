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

import React from "react";
// plane imports
import { ConvertToEpicIcon, ConvertToWorkitemIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { EWorkItemConversionType } from "@plane/types";
import { IconButton } from "@plane/propel/icon-button";

interface ConvertWorkItemIconProps {
  handleOnClick: () => void;
  conversionType: EWorkItemConversionType;
  canConvert: boolean;
}

export function ConvertWorkItemIcon(props: ConvertWorkItemIconProps) {
  const { handleOnClick, conversionType, canConvert } = props;
  // derived values
  const IconComponent =
    conversionType === EWorkItemConversionType.WORK_ITEM ? ConvertToWorkitemIcon : ConvertToEpicIcon;
  const tooltipContent =
    conversionType === EWorkItemConversionType.WORK_ITEM ? "Convert to Work item" : "Convert to Epic";

  return (
    <Tooltip tooltipContent={tooltipContent}>
      <IconButton
        variant="secondary"
        onClick={handleOnClick}
        disabled={!canConvert}
        size="lg"
        icon={IconComponent}
        aria-label={tooltipContent}
      />
    </Tooltip>
  );
}
