"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
// types
import {
  EUserPermissions,
  EUserPermissionsLevel,
  MEMBER_TRACKER_ELEMENTS,
  MEMBER_TRACKER_EVENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IWorkspaceBulkInviteFormData } from "@plane/types";
// ui
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { CountChip } from "@/components/common";
import { PageHead } from "@/components/core";
import { SettingsContentWrapper } from "@/components/settings";
import { WorkspaceMembersList } from "@/components/workspace";
// helpers
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useMember, useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web components
import { BillingActionsButton } from "@/plane-web/components/workspace/billing";
import { SendWorkspaceInvitationModal } from "@/plane-web/components/workspace/members";

const WorkspaceMembersSettingsPage = observer(() => {
  // states
  const [inviteModal, setInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const {
    workspace: { workspaceMemberIds, inviteMembersToWorkspace },
  } = useMember();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const handleWorkspaceInvite = (data: IWorkspaceBulkInviteFormData) => {
    if (!workspaceSlug) return;

    return inviteMembersToWorkspace(workspaceSlug.toString(), data)
      .then(() => {
        setInviteModal(false);
        captureSuccess({
          eventName: MEMBER_TRACKER_EVENTS.invite,
          payload: {
            emails: [...data.emails.map((email) => email.email)],
          },
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: t("workspace_settings.settings.members.invitations_sent_successfully"),
        });
      })
      .catch((err) => {
        captureError({
          eventName: MEMBER_TRACKER_EVENTS.invite,
          payload: {
            emails: [...data.emails.map((email) => email.email)],
          },
          error: err,
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: `${err.error ?? t("something_went_wrong_please_try_again")}`,
        });
        throw err;
      });
  };

  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Members` : undefined;

  // if user is not authorized to view this page
  if (workspaceUserInfo && !canPerformWorkspaceMemberActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper size="lg">
      <PageHead title={pageTitle} />
      <SendWorkspaceInvitationModal
        isOpen={inviteModal}
        onClose={() => setInviteModal(false)}
        onSubmit={handleWorkspaceInvite}
      />
      <section
        className={cn("w-full h-full", {
          "opacity-60": !canPerformWorkspaceMemberActions,
        })}
      >
        <div className="flex justify-between gap-4 pb-3.5 items-start">
          <h4 className="flex items-center gap-2.5 text-xl font-medium">
            {t("workspace_settings.settings.members.title")}
            {workspaceMemberIds && workspaceMemberIds.length > 0 && (
              <CountChip count={workspaceMemberIds.length} className="h-5 m-auto" />
            )}
          </h4>
          <div className="ml-auto flex items-center gap-1.5 rounded-md border border-custom-border-200 bg-custom-background-100 px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-custom-text-400" />
            <input
              className="w-full max-w-[234px] border-none bg-transparent text-sm outline-none placeholder:text-custom-text-400"
              placeholder={`${t("search")}...`}
              value={searchQuery}
              autoFocus
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {canPerformWorkspaceAdminActions && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setInviteModal(true)}
              data-ph-element={MEMBER_TRACKER_ELEMENTS.HEADER_ADD_BUTTON}
            >
              {t("workspace_settings.settings.members.add_member")}
            </Button>
          )}
          <BillingActionsButton canPerformWorkspaceAdminActions={canPerformWorkspaceAdminActions} />
        </div>
        <WorkspaceMembersList searchQuery={searchQuery} isAdmin={canPerformWorkspaceAdminActions} />
      </section>
    </SettingsContentWrapper>
  );
});

export default WorkspaceMembersSettingsPage;
