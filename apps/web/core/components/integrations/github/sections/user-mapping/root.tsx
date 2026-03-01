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

export function UserMappingRoot() {
  return (
    <div className="relative space-y-2">
      {/* heading */}
      <div className="text-body-xs-medium text-secondary">User Mapping</div>

      {/* content */}
      <div className="border border-subtle rounded-sm divide-y divide-subtle">
        <div className="relative text-body-sm-medium flex items-center bg-layer-1">
          <div className="p-2 px-3 w-full">Plane Users</div>
          <div className="p-2 px-3 w-full">Github users</div>
        </div>
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="relative text-body-sm-medium flex items-center">
            <div className="p-2 px-3 w-full text-secondary">Plane Member</div>
            <div className="p-2 px-3 w-full">Github Member Dropdown</div>
          </div>
        ))}
      </div>
    </div>
  );
}
