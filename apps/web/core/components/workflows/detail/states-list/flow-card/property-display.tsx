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
export const PropertyDisplay = ({
  label,
  icon,
  children,
}: {
  label: string;
  icon: JSX.Element;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-body-xs-medium">{label}</span>
    <div className="flex items-center gap-1 rounded-lg border border-subtle py-2 px-3 bg-layer-2 w-full truncate">
      {icon}
      {children}
    </div>
  </div>
);
