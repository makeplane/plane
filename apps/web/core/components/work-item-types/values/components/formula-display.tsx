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
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { Badge } from "@plane/propel/badge";

type TFormulaDisplayProps = {
  value?: string[];
};

export const FormulaDisplay = observer(function FormulaDisplay(props: TFormulaDisplayProps) {
  const { value } = props;

  // Formula values may come as a plain string from the API (not wrapped in an array)
  const displayValue = Array.isArray(value) ? value[0] : typeof value === "string" ? value : undefined;

  return (
    <Tooltip
      tooltipContent={displayValue ? displayValue : "Please reach out to admin for assistance"}
      position="top"
      disabled={!displayValue}
    >
      <div className="flex items-center gap-1.5 px-2 py-1 cursor-pointer truncate">
        {displayValue ? (
          <span className="flex-grow text-left text-secondary text-body-xs-medium truncate">{displayValue}</span>
        ) : (
          <Badge variant="danger">Error</Badge>
        )}
      </div>
    </Tooltip>
  );
});
