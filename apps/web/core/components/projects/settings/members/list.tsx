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
// plane imports
import { E_FEATURE_FLAGS, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { SearchIcon } from "@plane/propel/icons";
// components
import { MembersSettingsLoader } from "@/components/ui/loader/settings/members";
import { MemberListFiltersDropdown } from "@/components/projects/dropdowns/filters/member-list";
import { SendProjectInvitationModal } from "@/components/projects/modals/send-project-invitation-modal";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUserPermissions } from "@/hooks/store/user";
import { useProjectMembersActivity } from "@/plane-web/hooks/store/projects/use-project-members-activity";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// local imports
import { ProjectMemberListItem } from "./list-item";

type TProjectMemberListProps = {
  projectId: string;
  workspaceSlug: string;
};

export const ProjectMemberList = observer(function ProjectMemberList(props: TProjectMemberListProps) {
  const { projectId, workspaceSlug } = props;
  // states
  const [inviteModal, setInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const {
    project: { projectMemberIds, getFilteredProjectMemberDetails, filters },
  } = useMember();
  const { allowPermissions } = useUserPermissions();
  const { toggleProjectMembersActivitySidebar } = useProjectMembersActivity();
  // derived values

  const searchedProjectMembers = (projectMemberIds ?? []).filter((userId) => {
    const memberDetails = projectId ? getFilteredProjectMemberDetails(userId, projectId.toString()) : null;

    if (!memberDetails?.member || !memberDetails.original_role) return false;

    const fullName = `${memberDetails?.member.first_name} ${memberDetails?.member.last_name}`.toLowerCase();
    const displayName = memberDetails?.member.display_name.toLowerCase();

    return displayName?.includes(searchQuery.toLowerCase()) || fullName.includes(searchQuery.toLowerCase());
  });

  const memberDetails = searchedProjectMembers?.map((memberId) =>
    projectId ? getFilteredProjectMemberDetails(memberId, projectId.toString()) : null
  );

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);
  const isProjectMembersActivityEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.PROJECT_MEMBER_ACTIVITY);

  // Handler for role filter updates
  const handleRoleFilterUpdate = (role: string) => {
    if (projectId) {
      const currentFilters = filters.getFilters(projectId);
      const currentRoles = currentFilters?.roles || [];
      const updatedRoles = currentRoles.includes(role)
        ? currentRoles.filter((r) => r !== role)
        : [...currentRoles, role];

      filters.updateFilters(projectId, {
        roles: updatedRoles.length > 0 ? updatedRoles : undefined,
      });
    }
  };

  // Get current role filters
  const appliedRoleFilters = projectId ? filters.getFilters(projectId)?.roles || [] : [];

  return (
    <>
      <SendProjectInvitationModal
        isOpen={inviteModal}
        onClose={() => setInviteModal(false)}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      />
      <div className="flex items-center justify-between gap-4 py-2 overflow-x-hidden border-b border-subtle">
        <div className="text-14 font-semibold">{t("common.members")}</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-start gap-1.5 rounded-md border border-subtle bg-surface-1 px-2 py-1">
            <SearchIcon className="h-3.5 w-3.5" />
            <input
              className="w-full max-w-[234px] border-none bg-transparent text-13 focus:outline-none placeholder:text-placeholder"
              placeholder="Search"
              value={searchQuery}
              autoFocus
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <MemberListFiltersDropdown
            appliedFilters={appliedRoleFilters}
            handleUpdate={handleRoleFilterUpdate}
            memberType="project"
          />
          {isAdmin && isProjectMembersActivityEnabled && (
            <Button variant="secondary" size="lg" onClick={() => toggleProjectMembersActivitySidebar(projectId, true)}>
              {t("activity")}
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setInviteModal(true);
              }}
            >
              {t("add_member")}
            </Button>
          )}
        </div>
      </div>
      {!projectMemberIds ? (
        <MembersSettingsLoader />
      ) : (
        <div className="divide-y divide-subtle overflow-scroll">
          {searchedProjectMembers.length !== 0 && (
            <ProjectMemberListItem
              memberDetails={memberDetails ?? []}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
            />
          )}
          {searchedProjectMembers.length === 0 && (
            <h4 className="text-13 mt-16 text-center text-placeholder">{t("no_matching_members")}</h4>
          )}
        </div>
      )}
    </>
  );
});
