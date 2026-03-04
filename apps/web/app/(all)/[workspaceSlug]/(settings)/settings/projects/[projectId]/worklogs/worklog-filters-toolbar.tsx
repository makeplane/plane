/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ChevronDown, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@plane/propel/button";
import { CustomMenu } from "@plane/ui";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { DateRangeDropdown } from "@/components/dropdowns/date-range";

type TDateRange = { from: Date | undefined; to: Date | undefined };

interface Props {
  projectId: string;
  selectedUsers: string[];
  onSelectedUsersChange: (val: string[]) => void;
  dateRange: TDateRange;
  onDateRangeChange: (val: TDateRange) => void;
  onExport: (provider: "csv" | "xlsx") => void;
}

export const WorklogFiltersToolbar = ({
  projectId,
  selectedUsers,
  onSelectedUsersChange,
  dateRange,
  onDateRangeChange,
  onExport,
}: Props) => (
  <div className="my-6 flex items-center justify-between px-5">
    <div className="flex items-center gap-3">
      <MemberDropdown
        value={selectedUsers}
        multiple
        onChange={(val: string[]) => onSelectedUsersChange(val)}
        placeholder="Users"
        buttonClassName="border border-color-subtle shadow-none text-13 h-8 px-2"
        buttonVariant="border-with-text"
        renderByDefault
        projectId={projectId}
      />
      <DateRangeDropdown
        value={dateRange}
        onSelect={(val) => onDateRangeChange(val ? { from: val.from, to: val.to } : { from: undefined, to: undefined })}
        placeholder={{ from: "Start date", to: "End date" }}
        buttonClassName="border border-color-subtle shadow-none text-13 h-8 px-2"
        buttonVariant="border-with-text"
      />
    </div>
    <CustomMenu
      placement="bottom-end"
      customButton={
        <div className="flex items-center shadow-sm rounded-md">
          <Button
            variant="primary"
            className="rounded-r-none border-r border-white/20 px-4 text-13 shadow-none pointer-events-none h-8"
          >
            Download
          </Button>
          <Button variant="primary" className="rounded-l-none px-2.5 py-[0.5px] border-l-0 shadow-none h-8">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <CustomMenu.MenuItem onClick={() => onExport("csv")}>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span>Export as CSV</span>
        </div>
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem onClick={() => onExport("xlsx")}>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export as Excel</span>
        </div>
      </CustomMenu.MenuItem>
    </CustomMenu>
  </div>
);
