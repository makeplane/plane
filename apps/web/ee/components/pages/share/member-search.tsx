/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import React, { memo } from "react";
import { Search } from "lucide-react";
import { Avatar } from "@plane/propel/avatar";
import { CustomSearchSelect } from "@plane/ui";
import { getFileURL } from "@plane/utils";

type TMemberOption = {
  value: string;
  query: string;
  content: React.ReactNode;
};

type TMemberSearchProps = {
  memberOptions: TMemberOption[];
  onSelectMember: (memberId: string) => void;
  canCurrentUserChangeAccess?: boolean;
};

export const MemberOption = memo(function MemberOption({
  member,
}: {
  member: { display_name: string; avatar_url: string };
}) {
  return (
    <div className="flex w-full items-center gap-2 h-5">
      <Avatar name={member.display_name} src={getFileURL(member.avatar_url)} size="md" />
      <div className="truncate">
        <span className="font-medium">{member.display_name}</span>
      </div>
    </div>
  );
});

MemberOption.displayName = "MemberOption";

export function MemberSearch({ memberOptions, onSelectMember, canCurrentUserChangeAccess = true }: TMemberSearchProps) {
  if (!canCurrentUserChangeAccess) {
    return null;
  }

  return (
    <CustomSearchSelect
      value=""
      customButton={
        <span className="w-full flex items-center gap-1 text-placeholder p-2 rounded-sm border-[0.5px] border-subtle-1">
          <span className="shrink-0 size-4 grid place-items-center">
            <Search className="size-3.5" />
          </span>
          <span className="truncate">Find members to share this page with.</span>
        </span>
      }
      customButtonClassName="rounded"
      onChange={onSelectMember}
      options={memberOptions}
    />
  );
}

MemberSearch.displayName = "MemberSearch";
