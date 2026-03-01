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
import type { TIssuePage, TIssueServiceType } from "@plane/types";
import { PagesCollapsibleContentBlock } from "./block";

type TProps = {
  workspaceSlug: string;
  workItemId: string;
  disabled: boolean;
  isTabs?: boolean;
  projectId: string;
  data: TIssuePage[];
  issueServiceType: TIssueServiceType;
};

export const PagesCollapsibleContent = observer(function PagesCollapsibleContent(props: TProps) {
  const { workspaceSlug, workItemId, projectId, isTabs = false, data, issueServiceType } = props;

  return (
    <>
      <div className="py-2 space-y-3 w-full @container">
        <div className=" grid gap-4 p-2 grid-cols-1 @sm:grid-cols-2 @3xl:grid-cols-3">
          {data.map((item) => (
            <PagesCollapsibleContentBlock
              key={item?.id}
              workItemId={workItemId}
              page={item}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueServiceType={issueServiceType}
            />
          ))}
        </div>
      </div>
    </>
  );
});
