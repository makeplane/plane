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
import { memo } from "react";

type WidgetWrapperProps = {
  readonly children: ReactNode;
  readonly title?: string;
  readonly subtitle?: string;
  readonly actionsItem?: ReactNode;
};

export const WidgetWrapper: FC<WidgetWrapperProps> = memo(({ children, title, subtitle, actionsItem }) => {
  const hasHeader = title || subtitle;

  return (
    <div className="flex flex-col gap-4 w-full">
      {(hasHeader || actionsItem) && (
        <div className="flex items-center justify-between">
          {hasHeader && (
            <div className="flex flex-col gap-2">
              {title && <h3 className="text-h5-semibold">{title}</h3>}
              {subtitle && <p className="text-body-xs-regular text-tertiary">{subtitle}</p>}
            </div>
          )}
          {actionsItem}
        </div>
      )}
      {children}
    </div>
  );
});
WidgetWrapper.displayName = "WidgetWrapper";
