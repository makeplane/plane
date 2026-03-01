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
// local imports
import { BulkArchiveIssues } from "./archive";
import { BulkDeleteIssues } from "./delete";
import { BulkSubscribeIssues } from "./subscribe";

type Props = {
  handleClearSelection: () => void;
  selectedEntityIds: string[];
};

export const BulkOperationsActionsRoot = observer(function BulkOperationsActionsRoot(props: Props) {
  const { handleClearSelection, selectedEntityIds } = props;

  return (
    <>
      <div className="h-7 px-3 flex items-center gap-6 flex-shrink-0">
        <BulkSubscribeIssues handleClearSelection={handleClearSelection} selectedIssueIds={selectedEntityIds} />
        <BulkArchiveIssues handleClearSelection={handleClearSelection} selectedIssueIds={selectedEntityIds} />
      </div>
      <div className="h-7 px-3 flex items-center gap-3 flex-shrink-0">
        <BulkDeleteIssues handleClearSelection={handleClearSelection} selectedIssueIds={selectedEntityIds} />
      </div>
    </>
  );
});
