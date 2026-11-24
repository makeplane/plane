/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { sortBy } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import { Avatar } from "@makeplane/propel/components/avatar";
import { useTranslation } from "@plane/i18n";
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUser } from "@/hooks/store/user";
// local imports
import type { TFilterSubmenuOption } from "./filter-submenu";
import { FilterSubmenu } from "./filter-submenu";

type Props = {
  /** The member property — "Lead", "Members", "Assignees", "Created by"… */
  label: string;
  memberIds: string[] | undefined;
  appliedFilters: string[] | null | undefined;
  onToggle: (memberId: string) => void;
};

/**
 * A searchable member submenu for a filters menu. Applied members and then the current user lead the
 * list; the order is taken when the submenu opens so rows do not jump while being toggled.
 */
export const MemberFilterSubmenu = observer(function MemberFilterSubmenu(props: Props) {
  const { label, memberIds, appliedFilters, onToggle } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getUserDetails } = useMember();
  const { data: currentUser } = useUser();
  // states
  const [pinnedIds, setPinnedIds] = useState<string[]>(appliedFilters ?? []);

  const options = useMemo<TFilterSubmenuOption[]>(() => {
    const pinned = new Set(pinnedIds);
    const sortedIds = sortBy(memberIds ?? [], [
      (memberId) => !pinned.has(memberId),
      (memberId) => memberId !== currentUser?.id,
      (memberId) => getUserDetails(memberId)?.display_name.toLowerCase(),
    ]);

    return sortedIds.flatMap((memberId) => {
      const member = getUserDetails(memberId);
      if (!member) return [];
      return [
        {
          value: member.id,
          label: currentUser?.id === member.id ? t("common.you") : member.display_name,
          searchText: member.display_name,
          icon: (
            <Avatar
              alt={member.display_name}
              fallback={member.display_name?.[0]?.toUpperCase()}
              src={getFileURL(member.avatar_url)}
              size="xs"
            />
          ),
        },
      ];
    });
  }, [memberIds, pinnedIds, currentUser?.id, getUserDetails, t]);

  return (
    <FilterSubmenu
      label={label}
      options={options}
      appliedFilters={appliedFilters}
      onToggle={onToggle}
      searchable
      onOpenChange={(open) => {
        if (open) setPinnedIds(appliedFilters ?? []);
      }}
    />
  );
});
