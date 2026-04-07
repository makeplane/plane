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

import { range } from "lodash-es";
import { Loader } from "@plane/ui";

export function CollectionPageLoader() {
  return (
    <div className="size-full overflow-y-scroll vertical-scrollbar scrollbar-sm px-24 py-[54px]">
      <div className="flex flex-col gap-3">
        {/* Collection heading */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Loader.Item width="36px" height="36px" className="rounded-lg flex-shrink-0" />
            <Loader.Item width="180px" height="34px" />
            <Loader.Item width="80px" height="20px" className="rounded-md flex-shrink-0" />
          </div>
          <Loader.Item width="28px" height="28px" className="rounded-md flex-shrink-0" />
        </div>

        {/* Table */}
        <table className="table-auto w-full overflow-hidden whitespace-nowrap">
          <thead className="border-b border-subtle/60 divide-y-0">
            <tr className="divide-x-0">
              <th className="text-left px-4 py-2">
                <Loader.Item width="70px" height="14px" />
              </th>
              <th className="text-left px-4 py-2">
                <Loader.Item width="42px" height="14px" />
              </th>
              <th className="text-left px-4 py-2">
                <Loader.Item width="82px" height="14px" />
              </th>
              <th className="text-left px-4 py-2">
                <Loader.Item width="76px" height="14px" />
              </th>
              <th className="text-left px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y-0">
            {range(8).map((i) => (
              <tr key={i} className="divide-x-0">
                <td className="px-4 py-2">
                  <Loader className="flex items-center">
                    <Loader.Item width="16px" height="16px" className="rounded flex-shrink-0" />
                    <div className="ml-2">
                      <Loader.Item width={`${140 + i * 14}px`} height="16px" />
                    </div>
                  </Loader>
                </td>
                <td className="px-4 py-2">
                  <Loader className="flex items-center gap-1.5 w-36">
                    <Loader.Item width="16px" height="16px" className="rounded-full flex-shrink-0" />
                    <Loader.Item width="80px" height="14px" />
                  </Loader>
                </td>
                <td className="px-4 py-2">
                  <div className="w-32">
                    <Loader.Item width="20px" height="14px" />
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="w-32">
                    <Loader.Item width="60px" height="14px" />
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="w-12 flex justify-end">
                    <Loader.Item width="24px" height="24px" className="rounded-md" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
