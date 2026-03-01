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
import { Button } from "@plane/propel/button";
// plane web types
import type { TDefaultPaginatedInfo } from "@/types";

type TPaginationBar = {
  perPage: number;
  paginationInfo: TDefaultPaginatedInfo;
  onPrevClick: () => void;
  onNextClick: () => void;
};

export function PaginationBar(props: TPaginationBar) {
  const { perPage, paginationInfo, onPrevClick, onNextClick } = props;

  // derived values
  const totalCount = paginationInfo?.total_count || 0;
  const currentPage = Number(paginationInfo?.next_cursor?.split(":")[1] || 0);
  const staatPageCount = currentPage === 1 ? currentPage : currentPage * perPage - perPage + 1;
  const endPageCount = staatPageCount + perPage - 1;
  const finalStartCount = staatPageCount;
  const finalEndCount = endPageCount > totalCount ? totalCount : endPageCount;
  const renderCurrentPageStatus = `${finalStartCount}-${finalEndCount} of ${totalCount}`;

  return (
    <div className="w-full flex justify-between items-center gap-2">
      <div className="text-13 font-medium text-tertiary whitespace-nowrap">{renderCurrentPageStatus}</div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onPrevClick} disabled={!paginationInfo?.prev_page_results}>
          Prev
        </Button>
        <Button variant="secondary" onClick={onNextClick} disabled={!paginationInfo?.next_page_results}>
          Next
        </Button>
      </div>
    </div>
  );
}
