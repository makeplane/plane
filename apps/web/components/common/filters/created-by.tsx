/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { observer } from "mobx-react";
// local imports
import { MemberFilterSubmenu } from "./member-filter-submenu";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  memberIds: string[] | undefined;
};

/**
 * Render a searchable creator filter with a localized heading, prioritizing selected members and the current user.
 */
export const FilterCreatedBy = observer(function FilterCreatedBy(props: Props) {
  const { t } = useTranslation();
  const { appliedFilters, handleUpdate, memberIds } = props;

  return (
    <MemberFilterSubmenu
      label={t("common.created_by")}
      memberIds={memberIds}
      appliedFilters={appliedFilters}
      onToggle={handleUpdate}
    />
  );
});
