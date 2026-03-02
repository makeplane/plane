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

import { Command } from "cmdk";
import { observer } from "mobx-react";
// plane imports
import { Avatar } from "@plane/propel/avatar";
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import { PowerKModalCommandItem } from "../ui/modal/command-item";

type Props = {
  handleSelect: (assigneeId: string) => void;
  heading?: string;
  userIds: string[] | undefined;
  value: string[];
};

export const PowerKMembersMenu = observer(function PowerKMembersMenu(props: Props) {
  const { handleSelect, heading, userIds, value } = props;
  // store hooks
  const { getUserDetails } = useMember();

  return (
    <Command.Group heading={heading}>
      {userIds?.map((memberId) => {
        const memberDetails = getUserDetails(memberId);
        if (!memberDetails) return;

        return (
          <PowerKModalCommandItem
            key={memberId}
            iconNode={
              <Avatar
                name={memberDetails?.display_name}
                src={getFileURL(memberDetails?.avatar_url ?? "")}
                showTooltip={false}
                className="shrink-0"
              />
            }
            isSelected={value.includes(memberId)}
            label={memberDetails?.display_name}
            onSelect={() => handleSelect(memberId)}
          />
        );
      })}
    </Command.Group>
  );
});
