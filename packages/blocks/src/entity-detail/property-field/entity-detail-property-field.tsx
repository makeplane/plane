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

import type { ReactNode } from "react";
import { Tooltip } from "@plane/propel/tooltip";

export type EntityDetailPropertyFieldProps = {
  icon: (props: { className?: string }) => ReactNode;
  label: string;
  appendElement?: ReactNode;
  children: ReactNode;
};

export function EntityDetailPropertyField(props: EntityDetailPropertyFieldProps) {
  const { icon: Icon, label, appendElement, children } = props;

  return (
    <div className="flex items-start gap-2">
      <div className="flex shrink-0 items-center gap-2 w-30 text-body-xs-regular text-tertiary h-8 truncate">
        <Icon className="size-4 shrink-0" />
        <Tooltip tooltipContent={label}>
          <span className="truncate text-body-xs-regular">{label}</span>
        </Tooltip>
        {appendElement}
      </div>
      <div className="grow flex items-center flex-wrap gap-2 min-h-8 truncate">{children}</div>
    </div>
  );
}
