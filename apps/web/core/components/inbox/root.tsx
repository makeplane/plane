/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { PanelLeft } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { IntakeIcon } from "@plane/propel/icons";
import { EInboxIssueCurrentTab } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { InboxContentRoot } from "@/components/inbox/content";
import { InboxSidebar } from "@/components/inbox/sidebar";
import { InboxLayoutLoader } from "@/components/ui/loader/layouts/project-inbox/inbox-layout-loader";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

type TInboxIssueRoot = {
  workspaceSlug: string;
  projectId: string;
  inboxIssueId: string | undefined;
  inboxAccessible: boolean;
  navigationTab?: EInboxIssueCurrentTab | undefined;
};

export const InboxIssueRoot = observer(function InboxIssueRoot(props: TInboxIssueRoot) {
  const { workspaceSlug, projectId, inboxIssueId, inboxAccessible, navigationTab } = props;
  // states
  const [isMobileSidebar, setIsMobileSidebar] = useState(true);
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { loader, error, currentTab, currentInboxProjectId, handleCurrentTab, fetchInboxIssues } = useProjectInbox();

  useEffect(() => {
    if (!inboxAccessible || !workspaceSlug || !projectId) return;
    // Check if project has changed
    const hasProjectChanged = currentInboxProjectId && currentInboxProjectId !== projectId;

    if (navigationTab && navigationTab !== currentTab) {
      handleCurrentTab(workspaceSlug, projectId, navigationTab);
    } else if (hasProjectChanged) {
      handleCurrentTab(workspaceSlug, projectId, EInboxIssueCurrentTab.OPEN);
    } else {
      fetchInboxIssues(
        workspaceSlug.toString(),
        projectId.toString(),
        undefined,
        navigationTab || EInboxIssueCurrentTab.OPEN
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboxAccessible, workspaceSlug, projectId]);

  // loader
  if (loader === "init-loading")
    return (
      <div className="relative flex h-full w-full flex-col">
        <InboxLayoutLoader />
      </div>
    );

  // error
  if (error && error?.status === "init-error")
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-3">
        <IntakeIcon className="size-[60px]" strokeWidth={1.5} />
        <div className="text-secondary">{error?.message}</div>
      </div>
    );

  return (
    <>
      {!inboxIssueId && (
        <div className="flex h-12 w-full items-center border-b border-subtle px-4 lg:hidden">
          <PanelLeft
            onClick={() => setIsMobileSidebar(!isMobileSidebar)}
            className={cn("h-4 w-4", isMobileSidebar ? "text-accent-primary" : "text-secondary")}
          />
        </div>
      )}
      <div className="flex h-full w-full overflow-hidden bg-surface-1">
        <div
          className={cn(
            "absolute top-[50px] bottom-0 z-10 w-full flex-shrink-0 bg-surface-1 transition-all lg:!relative lg:!top-0 lg:w-2/6",
            isMobileSidebar ? "translate-x-0" : "-translate-x-full lg:!translate-x-0"
          )}
        >
          <InboxSidebar
            setIsMobileSidebar={setIsMobileSidebar}
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            inboxIssueId={inboxIssueId}
          />
        </div>

        {inboxIssueId ? (
          <InboxContentRoot
            setIsMobileSidebar={setIsMobileSidebar}
            isMobileSidebar={isMobileSidebar}
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
