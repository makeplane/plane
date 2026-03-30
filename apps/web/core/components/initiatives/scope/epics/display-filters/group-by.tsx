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

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TInitiativeScopeEpicGroupBy } from "@plane/types";
import { EIssueLayoutTypes } from "@plane/types";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters/header/helpers";

type Props = {
  activeLayout?: EIssueLayoutTypes;
  epicGroupBy: TInitiativeScopeEpicGroupBy;
  handleEpicGroupByChange: (groupBy: TInitiativeScopeEpicGroupBy) => void;
};

const EPIC_GROUP_BY_OPTIONS: Array<{ key: TInitiativeScopeEpicGroupBy; title: string }> = [
  { key: "none", title: "None" },
  { key: "state_groups", title: "State Group" },
  { key: "priority", title: "Priority" },
  { key: "assignees", title: "Assignees" },
];

export const EpicDisplayFilterGroupBy = observer(function EpicDisplayFilterGroupBy(props: Props) {
  const { activeLayout, epicGroupBy, handleEpicGroupByChange } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const options = useMemo(() => {
    return activeLayout === EIssueLayoutTypes.KANBAN
      ? EPIC_GROUP_BY_OPTIONS.filter((opt) => opt.key !== "none")
      : EPIC_GROUP_BY_OPTIONS;
  }, [activeLayout]);

  return (
    <>
      <FilterHeader
        title="Group by"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {options.map((option) => (
            <FilterOption
              key={option.key}
              isChecked={epicGroupBy === option.key}
              onClick={() => handleEpicGroupByChange(option.key)}
              title={option.title}
              multiple={false}
            />
          ))}
        </div>
      )}
    </>
  );
});
