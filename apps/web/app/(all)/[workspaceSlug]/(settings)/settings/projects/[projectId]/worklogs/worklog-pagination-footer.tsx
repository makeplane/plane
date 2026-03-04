/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@plane/propel/button";

interface Props {
  rangeStart: number;
  rangeEnd: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
  isLoading: boolean;
  onNext: () => void;
  onPrev: () => void;
}

export const WorklogPaginationFooter = ({
  rangeStart,
  rangeEnd,
  totalCount,
  hasNext,
  hasPrev,
  isLoading,
  onNext,
  onPrev,
}: Props) => (
  <div className="flex items-center justify-between px-5 py-3 text-sm text-color-secondary">
    <span>
      {rangeStart}-{rangeEnd} of {totalCount}
    </span>
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" disabled={!hasPrev || isLoading} onClick={onPrev}>
        <ChevronLeft className="h-4 w-4" />
        <span>Prev</span>
      </Button>
      <Button variant="secondary" size="sm" disabled={!hasNext || isLoading} onClick={onNext}>
        <span>Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  </div>
);
