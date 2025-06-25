"use client";

import { FC } from "react";
import { Button } from "@plane/ui";
// plane web types
import { TDefaultPaginatedInfo } from "@/plane-web/types";

type TPaginationBar = {
  perPage: number;
  paginationInfo: TDefaultPaginatedInfo;
  onPrevClick: () => void;
  onNextClick: () => void;
};

export const PaginationBar: FC<TPaginationBar> = (props) => {
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
      <div className="text-sm font-medium text-custom-text-300 whitespace-nowrap">{renderCurrentPageStatus}</div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="neutral-primary" onClick={onPrevClick} disabled={!paginationInfo?.prev_page_results}>
          Prev
        </Button>
        <Button size="sm" variant="neutral-primary" onClick={onNextClick} disabled={!paginationInfo?.next_page_results}>
          Next
        </Button>
      </div>
    </div>
  );
};
