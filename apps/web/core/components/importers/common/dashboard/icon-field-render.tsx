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

import type { FC, ReactNode } from "react";

type TIconFieldRender = {
  icon?: ReactNode;
  title?: string;
};

export function IconFieldRender(props: TIconFieldRender) {
  const { icon, title } = props;

  if (!icon && !title) return "-";
  if (!icon && title) return title;
  return (
    <div className="relative inline-flex items-center gap-2">
      <div className="w-4 h-4 flex-shrink-0 overflow-hidden relative flex justify-center items-center rounded-sm">
        {icon}
      </div>
      <div className="relative whitespace-nowrap line-clamp-1">{title}</div>
    </div>
  );
}
