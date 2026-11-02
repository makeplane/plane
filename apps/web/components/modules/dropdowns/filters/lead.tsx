/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// components
import { MemberFilterSubmenu } from "@/components/common/filters/member-filter-submenu";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  memberIds: string[] | undefined;
};

export const FilterLead = observer(function FilterLead(props: Props) {
  const { appliedFilters, handleUpdate, memberIds } = props;

  return (
    <MemberFilterSubmenu label="Lead" memberIds={memberIds} appliedFilters={appliedFilters} onToggle={handleUpdate} />
  );
});
