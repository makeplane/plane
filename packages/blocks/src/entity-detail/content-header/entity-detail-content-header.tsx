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
import { ChevronRight } from "lucide-react";

export type EntityDetailContentHeaderProps = {
  breadcrumb?: {
    parentElement: ReactNode;
    identifierElement: ReactNode;
    separator?: ReactNode;
  };
  titleElement: ReactNode;
};

export function EntityDetailContentHeader(props: EntityDetailContentHeaderProps) {
  const { breadcrumb, titleElement } = props;

  return (
    <div className="flex flex-col gap-2">
      {breadcrumb && (
        <div className="flex items-center gap-2">
          {breadcrumb.parentElement}
          {breadcrumb.separator ?? <ChevronRight className="size-4 shrink-0 text-tertiary" />}
          <div className="flex items-center gap-1.5 px-2 py-0.5">{breadcrumb.identifierElement}</div>
        </div>
      )}
      {titleElement}
    </div>
  );
}
