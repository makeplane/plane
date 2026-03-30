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
import type { TInitiativeScopeProjectGroupBy } from "@plane/types";
import { EIssueLayoutTypes } from "@plane/types";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters/header/helpers";

type Props = {
  activeLayout?: EIssueLayoutTypes;
  projectGroupBy: TInitiativeScopeProjectGroupBy;
  handleProjectGroupByChange: (groupBy: TInitiativeScopeProjectGroupBy) => void;
};

const PROJECT_GROUP_BY_OPTIONS: Array<{ key: TInitiativeScopeProjectGroupBy; title: string }> = [
  { key: "none", title: "None" },
  { key: "states", title: "States" },
  { key: "priority", title: "Priority" },
  { key: "lead", title: "Lead" },
];

export const ProjectDisplayFilterGroupBy = observer(function ProjectDisplayFilterGroupBy(props: Props) {
  const { activeLayout, projectGroupBy, handleProjectGroupByChange } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const options = useMemo(() => {
    return activeLayout === EIssueLayoutTypes.KANBAN
      ? PROJECT_GROUP_BY_OPTIONS.filter((opt) => opt.key !== "none")
      : PROJECT_GROUP_BY_OPTIONS;
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
              isChecked={projectGroupBy === option.key}
              onClick={() => handleProjectGroupByChange(option.key)}
              title={option.title}
              multiple={false}
            />
          ))}
        </div>
      )}
    </>
  );
});
