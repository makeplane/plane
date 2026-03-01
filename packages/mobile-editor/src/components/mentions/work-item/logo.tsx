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
// plane imports
import { StateGroupIcon } from "@plane/propel/icons";
import type { TIssue, TStateGroups } from "@plane/types";

type Props = {
  className?: string;
  projectId?: TIssue["project_id"];
  showOnlyWorkItemType?: boolean;
  stateGroup?: TStateGroups;
};

export const EditorWorkItemMentionLogo: React.FC<Props> = observer((props) => {
  const { className, stateGroup } = props;

  return (
    <>
      <StateGroupIcon stateGroup={stateGroup ?? "backlog"} className={className} />
    </>
  );
});
