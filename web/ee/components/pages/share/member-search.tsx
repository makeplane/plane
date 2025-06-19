"use client";

import React, { memo } from "react";
import { Search } from "lucide-react";
import { CustomSearchSelect, Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";

type TMemberOption = {
  value: string;
  query: string;
  content: React.ReactNode;
};

type TMemberSearchProps = {
  memberOptions: TMemberOption[];
  onSelectMember: (memberId: string) => void;
};

export const MemberOption = memo<{ member: { display_name: string; avatar_url: string } }>(({ member }) => (
  <div className="flex w-full items-center gap-2 h-5">
    <Avatar name={member.display_name} src={getFileURL(member.avatar_url)} size="md" />
    <div className="truncate">
      <span className="font-medium">{member.display_name}</span>
    </div>
  </div>
));

MemberOption.displayName = "MemberOption";

export const MemberSearch = ({ memberOptions, onSelectMember }: TMemberSearchProps) => (
  <CustomSearchSelect
    value=""
    customButton={
      <span className="w-full flex items-center gap-1 text-custom-text-400 p-2 rounded border-[0.5px] border-custom-border-300">
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

MemberSearch.displayName = "MemberSearch";
