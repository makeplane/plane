"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Search } from "lucide-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, MEMBER_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
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

export const ProjectMemberList: React.FC<TProjectMemberListProps> = observer((props) => {
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
      <div className="flex items-center justify-between gap-4 py-2 overflow-x-hidden border-b border-custom-border-100">
        <div className="text-base font-semibold">{t("common.members")}</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-start gap-1.5 rounded-md border border-custom-border-200 bg-custom-background-100 px-2 py-1">
            <Search className="h-3.5 w-3.5" />
            <input
              className="w-full max-w-[234px] border-none bg-transparent text-sm focus:outline-none placeholder:text-custom-text-400"
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
          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setInviteModal(true);
              }}
              data-ph-element={MEMBER_TRACKER_ELEMENTS.HEADER_ADD_BUTTON}
            >
              {t("add_member")}
            </Button>
          )}
        </div>
      </div>
      {!projectMemberIds ? (
        <MembersSettingsLoader />
      ) : (
        <div className="divide-y divide-custom-border-100 overflow-scroll">
          {searchedProjectMembers.length !== 0 && (
            <ProjectMemberListItem
              memberDetails={memberDetails ?? []}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
            />
          )}
          {searchedProjectMembers.length === 0 && (
            <h4 className="text-sm mt-16 text-center text-custom-text-400">{t("no_matching_members")}</h4>
          )}
        </div>
      )}
    </>
  );
});
