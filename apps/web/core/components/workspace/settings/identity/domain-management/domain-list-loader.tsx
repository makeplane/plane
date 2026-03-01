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

import { Table, TableBody, TableCell, TableRow } from "@plane/propel/table";
import { Loader } from "@plane/ui";

export function DomainListLoader() {
  return (
    <Loader>
      <div className="w-full">
        <Table>
          <TableBody>
            {Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell className="py-4">
                  <Loader.Item height="14px" width="120px" />
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex gap-2">
                    <Loader.Item height="12px" width="12px" className="rounded-full" />
                    <Loader.Item height="14px" width="60px" />
                  </div>
                </TableCell>
                <TableCell className="py-4 text-right">
                  <Loader.Item height="20px" width="10px" className="rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Loader>
  );
}
