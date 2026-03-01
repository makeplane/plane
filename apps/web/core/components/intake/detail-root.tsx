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
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { IntakeIcon } from "@plane/propel/icons";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { IntakeDetailContentRoot } from "./content/detail-root";

type TIntakeDetailViewRoot = {
  workspaceSlug: string;
  projectId: string;
  inboxIssueId: string | undefined;
};

export const IntakeDetailViewRoot = observer(function IntakeDetailViewRoot(props: TIntakeDetailViewRoot) {
  const { workspaceSlug, projectId, inboxIssueId } = props;
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { error } = useProjectInbox();

  // error
  if (error && error?.status === "init-error")
    return (
      <div className="relative w-full h-full flex flex-col gap-3 justify-center items-center">
        <IntakeIcon className="size-[60px]" strokeWidth={1.5} />
        <div className="text-secondary">{error?.message}</div>
      </div>
    );

  return (
    <>
      <div className="w-full h-full flex overflow-hidden bg-surface-1">
        {inboxIssueId ? (
          <IntakeDetailContentRoot
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            inboxIssueId={inboxIssueId.toString()}
          />
        ) : (
          <EmptyStateCompact
            assetKey="intake"
            title={t("project_empty_state.intake_main.title")}
            assetClassName="size-20"
          />
        )}
      </div>
    </>
  );
});
