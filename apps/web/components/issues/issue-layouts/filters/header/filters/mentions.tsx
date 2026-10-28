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

export const FilterMentions = observer(function FilterMentions(props: Props) {
  const { appliedFilters, handleUpdate, memberIds } = props;

  return (
    <MemberFilterSubmenu
      label="Mentions"
      memberIds={memberIds}
      appliedFilters={appliedFilters}
      onToggle={handleUpdate}
    />
  );
});
