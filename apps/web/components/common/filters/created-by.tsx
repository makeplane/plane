/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// local imports
import { MemberFilterSubmenu } from "./member-filter-submenu";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  memberIds: string[] | undefined;
};

export const FilterCreatedBy = observer(function FilterCreatedBy(props: Props) {
  const { appliedFilters, handleUpdate, memberIds } = props;

  return (
    <MemberFilterSubmenu
      label="Created by"
      memberIds={memberIds}
      appliedFilters={appliedFilters}
      onToggle={handleUpdate}
    />
  );
});
