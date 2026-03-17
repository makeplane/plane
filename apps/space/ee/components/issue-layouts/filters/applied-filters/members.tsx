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

import { observer } from "mobx-react";
import { CloseIcon } from "@plane/propel/icons";
// ui
import { Avatar } from "@plane/propel/avatar";
import { useMember } from "@/hooks/store/use-member";
// types

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
};

export const AppliedMembersFilters = observer(function AppliedMembersFilters(props: Props) {
  const { handleRemove, values } = props;

  const { getMemberById } = useMember();

  return (
    <>
      {values.map((memberId) => {
        const memberDetails = getMemberById(memberId);

        if (!memberDetails) return null;

        return (
          <div key={memberId} className="flex items-center gap-1 rounded-sm bg-layer-3 p-1 text-11">
            <Avatar name={memberDetails.member__display_name} src={memberDetails.member__avatar} showTooltip={false} />
            <span className="normal-case">{memberDetails.member__display_name}</span>
            <button
              type="button"
              className="grid place-items-center text-tertiary hover:text-secondary"
              onClick={() => handleRemove(memberId)}
            >
              <CloseIcon height={10} width={10} strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </>
  );
});
