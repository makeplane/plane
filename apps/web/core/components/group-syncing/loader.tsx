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

import { Loader } from "@plane/ui";

export function GroupMappingTableLoader() {
  return (
    <Loader>
      <table className="table-auto border-b border-subtle-1 w-full overflow-hidden whitespace-nowrap">
        <thead className="border-b border-subtle-1">
          <tr>
            <th className="p-2.5">
              <Loader.Item height="18.9px" width="33.33%" />
            </th>
            <th className="p-2.5">
              <Loader.Item height="18.9px" width="33.33%" />
            </th>
            <th className="p-2.5">
              <Loader.Item height="18.9px" width="33.33%" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index}>
              <td className="p-2.5">
                <Loader.Item height="18.9px" width="33.33%" />
              </td>
              <td className="p-2.5">
                <Loader.Item height="18.9px" width="33.33%" />
              </td>
              <td className="p-2.5">
                <Loader.Item height="18.9px" width="33.33%" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Loader>
  );
}
