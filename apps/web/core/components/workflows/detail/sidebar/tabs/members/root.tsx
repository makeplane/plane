/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useMember } from "@/hooks/store/use-member";
import useDebounce from "@/hooks/use-debounce";
import { Button } from "@plane/propel/button";
import { ChevronRightIcon, SearchIcon } from "@plane/propel/icons";
import { Input } from "@plane/propel/input";
import { Avatar } from "@plane/propel/avatar";
import { Checkbox } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import type { IWorkflowState, IWorkflowTransition } from "@plane/types";

type Props = {
  transition: IWorkflowTransition;
  state: IWorkflowState;
  onNext: () => void;
};

export const MembersTabContent = observer(function MembersTabContent(props: Props) {
  const { state, transition, onNext } = props;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(transition.member_ids ?? []);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const {
    project: { projectMemberIds },
    getUserDetails,
  } = useMember();

  useEffect(() => {
    setSelectedMembers(transition.member_ids ?? []);
  }, [transition.id, transition.member_ids]);

  if (!projectMemberIds) return null;

  const memberOptions = projectMemberIds
    .map((memberId) => getUserDetails(memberId))
    .filter((member) => member !== undefined);

  const filteredMemberOptions = memberOptions.filter((member) =>
    member?.display_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  const isAllMembersSelected = selectedMembers.length == 0;

  const toggleSelectMember = (memberId: string) => {
    const next = selectedMembers.includes(memberId)
      ? selectedMembers.filter((id) => id !== memberId)
      : [...selectedMembers, memberId];
    setSelectedMembers(next);
  };

  const toggleSelectAllMembers = (isAll: boolean) => {
    setSelectedMembers(isAll ? [] : [...projectMemberIds]);
  };

  const handleNext = () => {
    transition.mutate({ member_ids: selectedMembers });
    onNext();
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-h6-medium">Members</p>
      <div className="flex flex-col gap-2">
        <Input
          placeholder="Search members"
          inputSize="xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
          prependIcon={<SearchIcon />}
        />
      </div>
      <div className="flex flex-col gap-2">
        {state.type === "transition" && (
          <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-layer-1 rounded-md">
            <Checkbox
              type="checkbox"
              checked={isAllMembersSelected}
              onChange={(e) => toggleSelectAllMembers(e.target.checked)}
              id="transition-select-all-members"
              className="focus:outline-none"
            />
            <label
              htmlFor="transition-select-all-members"
              className="cursor-pointer flex-1 text-body-sm-regular flex items-center justify-between"
            >
              <span>All</span>
              <span className="text-placeholder text-caption-md-regular">Default</span>
            </label>
          </div>
        )}
        {filteredMemberOptions.map((member) => (
          <div key={member.id} className="flex items-center gap-2 py-1.5 px-2 hover:bg-layer-1 rounded-md">
            <Checkbox
              type="checkbox"
              checked={selectedMembers.includes(member.id)}
              onChange={() => toggleSelectMember(member.id)}
              id={member.id}
              className="focus:outline-none"
            />
            <label htmlFor={member.id} className="flex items-center gap-2 cursor-pointer">
              <Avatar size="sm" name={member.display_name} src={getFileURL(member.avatar_url)} showTooltip={false} />
              <span className="normal-case text-body-sm-regular">{member.display_name}</span>
            </label>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button variant="primary" onClick={handleNext} appendIcon={<ChevronRightIcon className="size-4" />}>
          Next
        </Button>
      </div>
    </div>
  );
});
