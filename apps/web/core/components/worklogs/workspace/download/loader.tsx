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

import type { FC } from "react";
import { Loader } from "@plane/ui";
// plane web types
import { EWorklogDownloadLoader } from "@/constants/workspace-worklog";

export type TWorklogDownloadLoader = {
  loader?: EWorklogDownloadLoader;
};

export function WorklogDownloadLoader(props: TWorklogDownloadLoader) {
  const { loader } = props;

  return (
    <Loader className="space-y-4">
      {/* header */}
      {loader === EWorklogDownloadLoader.INIT_LOADER && (
        <div className="flex items-center gap-2">
          <Loader.Item height="24px" width="24px" />
          <Loader.Item height="24px" width="20%" />
          <Loader.Item height="24px" width="24px" />
        </div>
      )}

      {/* content blocks */}
      <div className="divide-y divide-subtle-1">
        {Array.from({ length: 10 }).map((_, index) => (
          <Loader key={index} className="flex justify-between items-center gap-2 p-2.5">
            <div className="w-full space-y-1">
              <div className="flex items-center gap-2">
                <Loader.Item height="19.1px" width="160px" />
                <Loader.Item height="19.1px" width="60px" />
              </div>
              <div className="flex items-center text-placeholder gap-1">
                <Loader.Item height="18px" width="40px" />|<Loader.Item height="18px" width="60px" />
              </div>
            </div>
            <Loader.Item height="22px" width="100px" />
          </Loader>
        ))}
      </div>

      {/* pagination */}
      {loader === EWorklogDownloadLoader.INIT_LOADER && (
        <div className="flex justify-between items-center gap-2 py-4">
          <Loader.Item height="20px" width="70px" />
          <div className="flex items-center gap-2">
            <Loader.Item height="28px" width="70px" />
            <Loader.Item height="28px" width="70px" />
          </div>
        </div>
      )}
    </Loader>
  );
}
