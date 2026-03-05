/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef } from "react";
//types
import { observer } from "mobx-react";
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
//components
import { shouldRenderColumn } from "@/plane-web/helpers/issue-filter.helper";
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";
import { HeaderColumn } from "./columns/header-column";

const COLUMN_WIDTHS: Partial<Record<keyof IIssueDisplayProperties, string>> = {
  state: "80px",
  priority: "80px",
  assignee: "120px",
  estimate: "80px",
  labels: "80px",
  start_date: "120px",
  due_date: "120px",
  created_on: "120px",
  updated_on: "120px",
  link: "80px",
  attachment_count: "80px",
  sub_issue_count: "80px",
  cycle: "120px",
  modules: "120px",
};

interface Props {
  displayProperties: IIssueDisplayProperties;
  property: keyof IIssueDisplayProperties;
  isEstimateEnabled: boolean;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  isEpic?: boolean;
}
export const SpreadsheetHeaderColumn = observer(function SpreadsheetHeaderColumn(props: Props) {
  const { displayProperties, displayFilters, property, handleDisplayFilterUpdate, isEpic = false } = props;

  //hooks
  const tableHeaderCellRef = useRef<HTMLTableCellElement | null>(null);

  const shouldRenderProperty = shouldRenderColumn(property);

  return (
    <WithDisplayPropertiesHOC
      displayProperties={displayProperties}
      displayPropertyKey={property}
      shouldRenderProperty={() => shouldRenderProperty}
    >
      <th
        className="h-11 min-w-36 items-center bg-layer-1 text-13 font-medium py-1 border border-b-0 border-t-0 border-subtle"
        style={{ width: COLUMN_WIDTHS[property] ?? "auto" }}
        ref={tableHeaderCellRef}
        tabIndex={0}
      >
        <HeaderColumn
          displayFilters={displayFilters}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          property={property}
          onClose={() => {
            tableHeaderCellRef?.current?.focus();
          }}
          isEpic={isEpic}
        />
      </th>
    </WithDisplayPropertiesHOC>
  );
});
