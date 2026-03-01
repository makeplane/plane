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

import { useState } from "react";
import { observer } from "mobx-react";
// types
import { E_FEATURE_FLAGS, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { SearchIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspaceBulkInviteFormData } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { CountChip } from "@/components/common/count-chip";
import { PageHead } from "@/components/core/page-title";
import { MemberListFiltersDropdown } from "@/components/projects/dropdowns/filters/member-list";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { WorkspaceMembersList } from "@/components/workspace/settings/members-list";
import { MembersImportModal } from "@/components/workspace/settings/members/members-import-modal";
import { MembersActivityButton } from "@/components/workspace/settings/members/members-activity-button";
import { BillingActionsButton } from "@/components/workspace/settings/billing/billing-actions-button";
import { SendWorkspaceInvitationModal } from "@/components/workspace/settings/members/invite-modal/root";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { useFlag } from "@/plane-web/hooks/store";
// types
import type { Route } from "./+types/page";
// local imports
import { MembersWorkspaceSettingsHeader } from "./header";

const WorkspaceMembersSettingsPage = observer(function WorkspaceMembersSettingsPage({ params }: Route.ComponentProps) {
  // states
  const [inviteModal, setInviteModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  // router
  const { workspaceSlug } = params;
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const {
    workspace: { workspaceMemberIds, inviteMembersToWorkspace, filtersStore },
  } = useMember();
  const { currentWorkspace } = useWorkspace();

  const isMembersImportEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.WORKSPACE_MEMBERS_IMPORT, false);
  const { t } = useTranslation();

  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const handleWorkspaceInvite = async (data: IWorkspaceBulkInviteFormData) => {
    try {
      await inviteMembersToWorkspace(workspaceSlug, data);

      setInviteModal(false);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: t("workspace_settings.settings.members.invitations_sent_successfully"),
      });
    } catch (error: unknown) {
      let message = undefined;
      if (error instanceof Error) {
        const err = error as Error & { error?: string };
        message = err.error;
      }
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: `${message ?? t("something_went_wrong_please_try_again")}`,
      });

      throw error;
    }
  };

  // Handler for role filter updates
  const handleRoleFilterUpdate = (role: string) => {
    const currentFilters = filtersStore.filters;
    const currentRoles = currentFilters?.roles || [];
    const updatedRoles = currentRoles.includes(role) ? currentRoles.filter((r) => r !== role) : [...currentRoles, role];

    filtersStore.updateFilters({
      roles: updatedRoles.length > 0 ? updatedRoles : undefined,
    });
  };

  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Members` : undefined;
  const appliedRoleFilters = filtersStore.filters?.roles || [];

  // if user is not authorized to view this page
  if (workspaceUserInfo && !canPerformWorkspaceMemberActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<MembersWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <SendWorkspaceInvitationModal
        isOpen={inviteModal}
        onClose={() => setInviteModal(false)}
        onSubmit={handleWorkspaceInvite}
      />
      <MembersImportModal isOpen={importModal} onClose={() => setImportModal(false)} workspaceSlug={workspaceSlug} />
      <section
        className={cn("size-full", {
          "opacity-60": !canPerformWorkspaceMemberActions,
        })}
      >
        <div className="flex justify-between gap-4 pb-3.5 items-center">
          <h4 className="flex items-center gap-2.5 text-h3-medium">
            {t("workspace_settings.settings.members.title")}
            {workspaceMemberIds && workspaceMemberIds.length > 0 && (
              <CountChip count={workspaceMemberIds.length} className="h-5 m-auto" />
            )}
          </h4>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border border-subtle bg-surface-1 px-2.5 py-1.5">
              <SearchIcon className="h-3.5 w-3.5 text-placeholder" />
              <input
                className="w-full max-w-[234px] border-none bg-transparent text-body-xs-regular outline-none placeholder:text-placeholder"
                placeholder={`${t("search")}...`}
                value={searchQuery}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <MemberListFiltersDropdown
              appliedFilters={appliedRoleFilters}
              handleUpdate={handleRoleFilterUpdate}
              memberType="workspace"
            />
            <MembersActivityButton workspaceSlug={workspaceSlug} />
            {canPerformWorkspaceAdminActions && (
              <>
                {isMembersImportEnabled && (
                  <Button variant="secondary" size="lg" onClick={() => setImportModal(true)}>
                    Import
                  </Button>
                )}
                <Button variant="primary" size="lg" onClick={() => setInviteModal(true)}>
                  {t("workspace_settings.settings.members.add_member")}
                </Button>
              </>
            )}
            <BillingActionsButton canPerformWorkspaceAdminActions={canPerformWorkspaceAdminActions} />
          </div>
        </div>
        <WorkspaceMembersList
          workspaceSlug={workspaceSlug}
          searchQuery={searchQuery}
          isAdmin={canPerformWorkspaceAdminActions}
        />
      </section>
    </SettingsContentWrapper>
  );
});

export default WorkspaceMembersSettingsPage;
