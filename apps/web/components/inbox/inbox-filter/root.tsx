/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { ChevronDownOutline, FilterOutline } from "@makeplane/propel/icons";
import { Button } from "@makeplane/propel/elements/button";
// plane imports
// components
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
// hooks
import useSize from "@/hooks/use-window-size";
// local imports
import { InboxIssueFilterSelection } from "./filters/filter-selection";
import { InboxIssueOrderByDropdown } from "./sorting/order-by";

const smallButton = <FilterOutline className="size-3" />;

export function FiltersRoot() {
  const { t } = useTranslation();

  const windowSize = useSize();
  const largeButton = (
    <Button variant="secondary" size="sm" stretch="auto" render={<span />}>
      <FilterOutline className="size-3" />
      <span>{t("common.filters")}</span>
      <ChevronDownOutline className="size-3" />
    </Button>
  );

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
