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

export type EntityDetailContentFooterProps = {
  leftElement?: ReactNode;
  rightElement?: ReactNode;
};

export function EntityDetailContentFooter(props: EntityDetailContentFooterProps) {
  const { leftElement, rightElement } = props;

  return (
    <div className="flex items-center justify-between gap-2">
      {leftElement}
      {rightElement}
    </div>
  );
}
