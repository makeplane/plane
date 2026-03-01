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
import { LockIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";

interface LockedTabLabelProps {
  label: React.ReactNode;
  t: (key: string, params?: Record<string, any>) => string;
}

function LockedTabLabel({ label, t }: LockedTabLabelProps) {
  return (
    <Tooltip
      tooltipContent={
        <>
          {t("workspace_analytics.upgrade_to_plan", {
            plan: <span className={cn("text-accent-primary")}>{t("sidebar.pro")}</span>,
            tab: label,
          })}
        </>
      }
    >
      <div className="flex gap-2 justify-center items-center">
        {label} <LockIcon width={10} height={10} />
      </div>
    </Tooltip>
  );
}

export default LockedTabLabel;
