/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/blocks/empty-state";
import { Button } from "@makeplane/propel/components/button";
import { ExpandableSearch } from "@makeplane/propel/components/expandable-search";
// components
import { MembersSettingsLoader } from "@/components/ui/loader/settings/members";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { MemberListFiltersDropdown } from "./dropdowns/filters/member-list";
import { ProjectMemberListItem } from "./member-list-item";
import { SendProjectInvitationModal } from "./send-project-invitation-modal";

type TProjectMemberListProps = {
  projectId: string;
  workspaceSlug: string;
};

export const ProjectMemberList = observer(function ProjectMemberList(props: TProjectMemberListProps) {
  const { projectId, workspaceSlug } = props;
  // states
  const [inviteModal, setInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    project: { projectMemberIds, getFilteredProjectMemberDetails, filters },
  } = useMember();
  const { allowPermissions } = useUserPermissions();

  const { t } = useTranslation();

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
      <div className="flex items-center justify-between gap-4 overflow-x-hidden pt-1 pb-3">
        <div className="text-body-md-semibold">{t("common.members")}</div>
        <div className="flex items-center gap-3">
          <ExpandableSearch
            size="md"
            aria-label={t("common.search.label")}
            clearLabel={t("common.clear")}
            placeholder={`${t("search")}...`}
            value={searchQuery}
            onValueChange={(value) => setSearchQuery(value)}
          />
          <MemberListFiltersDropdown
            appliedFilters={appliedRoleFilters}
            handleUpdate={handleRoleFilterUpdate}
            memberType="project"
          />
          {isAdmin && (
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              label={t("add_member")}
              onClick={() => {
                setInviteModal(true);
              }}
            />
          )}
        </div>
      </div>
      {!projectMemberIds ? (
        <MembersSettingsLoader />
      ) : (
        <div>
          {searchedProjectMembers.length !== 0 && (
            <div className="flex max-h-[60vh] flex-col">
              <ProjectMemberListItem
                memberDetails={memberDetails ?? []}
                projectId={projectId}
                workspaceSlug={workspaceSlug}
              />
            </div>
          )}
          {searchedProjectMembers.length === 0 && (
            <EmptyStateCompact
              assetKey="search-compact"
              title={t("no_matching_members")}
              rootClassName="rounded-lg border border-subtle py-10"
            />
          )}
        </div>
      )}
    </>
  );
});
