/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ListFilter } from "lucide-react";
import { Button } from "@makeplane/propel/elements/button";
// plane imports
import { ChevronDownIcon } from "@plane/propel/icons";
// components
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
// hooks
import useSize from "@/hooks/use-window-size";
// local imports
import { InboxIssueFilterSelection } from "./filters/filter-selection";
import { InboxIssueOrderByDropdown } from "./sorting/order-by";

const smallButton = <ListFilter className="size-3" />;

const largeButton = (
  <Button variant="secondary" size="sm" stretch="auto" render={<div />}>
    <ListFilter className="size-3" />
    <span>Filters</span>
    <ChevronDownIcon className="size-3" strokeWidth={2} />
  </Button>
);
export function FiltersRoot() {
  const windowSize = useSize();

  return (
    <div className="relative flex items-center gap-2">
      <div>
        <FiltersDropdown menuButton={windowSize[0] > 1280 ? largeButton : smallButton} title="" placement="bottom-end">
          <InboxIssueFilterSelection />
        </FiltersDropdown>
      </div>
      <div>
        <InboxIssueOrderByDropdown />
      </div>
    </div>
  );
}
