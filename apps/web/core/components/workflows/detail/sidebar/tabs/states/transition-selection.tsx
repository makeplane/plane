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

import { useProjectState } from "@/hooks/store/use-project-state";
import { TransitionStatesList } from "./states-list";
import { SearchIcon } from "@plane/propel/icons";
import { Input } from "@plane/propel/input";
import { useState } from "react";
import { observer } from "mobx-react";

type Props = {
  onChange: (stateId: string) => void;
  selectedStateId?: string;
  currentStateId: string;
  occupiedStateIds: string[];
};

export const TransitionStateSelection = observer(function TransitionStateSelection(props: Props) {
  // props
  const { onChange, selectedStateId, currentStateId, occupiedStateIds } = props;
  // states
  const [searchQuery, setSearchQuery] = useState("");
  // hooks
  const { groupedProjectStates } = useProjectState();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-3">
        {/* Search and filters */}
        <Input
          placeholder="Search states"
          inputSize="xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
          prependIcon={<SearchIcon />}
        />
        {/* States list */}
        <div className="flex flex-col gap-2">
          {groupedProjectStates &&
            Object.entries(groupedProjectStates).map(([groupKey, groupStates]) => (
              <div key={groupKey}>
                <h6 className="text-caption-md-regular capitalize text-tertiary py-1.5 px-2">{groupKey}</h6>
                <TransitionStatesList
                  states={groupStates}
                  selectedStates={selectedStateId ? [selectedStateId] : []}
                  onChange={onChange}
                  searchQuery={searchQuery}
                  disabledStateIds={[currentStateId, ...occupiedStateIds]}
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
});
