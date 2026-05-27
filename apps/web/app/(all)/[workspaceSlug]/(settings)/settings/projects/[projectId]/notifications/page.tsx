/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Project → Notifications. Per-project Slack channel mappings:
 * each row binds one Slack channel + a set of event types
 * (work-item created, state change, comment, marked done) to this
 * project. Stored as a `WorkspaceEntityConnection` row with
 * `type=slack-channel-notification`.
 */

import { observer } from "mobx-react";

import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";

import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { ProjectSlackNotificationsRoot } from "@/components/integration/slack-notifications";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";

import type { Route } from "./+types/page";
import { NotificationsProjectSettingsHeader } from "./header";

function NotificationsSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentProjectDetails: projectDetails } = useProject();

  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  const pageTitle = projectDetails?.name ? `${projectDetails.name} - Notifications` : undefined;

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<NotificationsProjectSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <section className="w-full">
        <SettingsHeading
          title="Notifications"
          description="Send Slack notifications to a channel when work items in this project change."
        />
        <div className="mt-6">
          <ProjectSlackNotificationsRoot workspaceSlug={workspaceSlug} projectId={projectId} />
        </div>
      </section>
    </SettingsContentWrapper>
  );
}

export default observer(NotificationsSettingsPage);
