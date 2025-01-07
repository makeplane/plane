import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { BriefcaseIcon, FileText, Layers, Loader as Spinner, Users } from "lucide-react";
// ui
import { ContrastIcon, LayersIcon } from "@plane/ui";
// components
import { MemberDropdown } from "@/components/dropdowns";
import { Props } from "@/components/icons/types";
// hooks
import { cn } from "@/helpers/common.helper";
// plane web hooks
import { useMember } from "@/hooks/store";
import { EUserPermissions } from "@/plane-web/constants";
import { useTeams } from "@/plane-web/hooks/store";
// local components
import { TeamsPropertiesList } from "./list";
import { TeamEntitiesLoader } from "./loader";

type TTeamsOverviewSidebarPropertiesProps = {
  teamId: string;
  isEditingAllowed: boolean;
};

export type TPropertyListItem = {
  key: string;
  label: string;
  icon: React.FC<Props>;
  value: React.ReactNode;
  href?: string;
};

export const TeamsOverviewSidebarProperties = observer((props: TTeamsOverviewSidebarPropertiesProps) => {
  const { teamId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const {
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails },
  } = useMember();
  const { getTeamById, getTeamEntitiesById, getTeamEntitiesLoaderById, updateTeam } = useTeams();
  // derived values
  const team = getTeamById(teamId);
  const teamEntities = getTeamEntitiesById(teamId);
  const teamEntitiesLoader = getTeamEntitiesLoaderById(teamId);
  const linkedEntitiesCount = teamEntities?.linked_entities.total;
  const teamEntitiesCount = teamEntities?.team_entities.total;
  const userIdsWithAdminOrMemberRole = useMemo(
    () =>
      workspaceMemberIds?.filter((userId) => {
        const memberDetails = getWorkspaceMemberDetails(userId);
        return memberDetails?.role === EUserPermissions.GUEST ? false : true;
      }),
    [workspaceMemberIds, getWorkspaceMemberDetails]
  );

  if (!team) return null;

  const handleTeamLeadChange = useCallback(
    (val: string | null) => {
      if (val && val !== team.lead_id) {
        updateTeam(workspaceSlug?.toString(), teamId, { lead_id: val });
      } else {
        updateTeam(workspaceSlug?.toString(), teamId, { lead_id: undefined });
      }
    },
    [teamId, team.lead_id, updateTeam, workspaceSlug]
  );

  const TEAM_PROPERTIES: TPropertyListItem[] = useMemo(
    () => [
      {
        key: "lead",
        label: "Lead",
        icon: Users,
        value: (
          <MemberDropdown
            value={team.lead_id ?? null}
            memberIds={userIdsWithAdminOrMemberRole}
            onChange={handleTeamLeadChange}
            multiple={false}
            buttonVariant="transparent-with-text"
            buttonContainerClassName={cn(
              "flex-shrink-0 w-full text-left",
              team.lead_id ? "text-custom-text-200" : "text-custom-text-400"
            )}
            placeholder="Select team lead"
            showUserDetails
            disabled={!isEditingAllowed}
          />
        ),
      },
    ],
    [handleTeamLeadChange, team.lead_id, userIdsWithAdminOrMemberRole, isEditingAllowed]
  );

  const LINKED_ENTITIES: TPropertyListItem[] = useMemo(
    () => [
      {
        key: "projects",
        label: "Projects",
        icon: BriefcaseIcon,
        value: teamEntities?.linked_entities.projects,
        href: `/${workspaceSlug}/teams/${teamId}/projects`,
      },
      {
        key: "issues",
        label: "Issues",
        icon: LayersIcon,
        value: teamEntities?.linked_entities.issues,
        href: `/${workspaceSlug}/teams/${teamId}/issues`,
      },
      {
        key: "cycles",
        label: "Cycles",
        icon: ContrastIcon,
        value: teamEntities?.linked_entities.cycles,
        href: `/${workspaceSlug}/teams/${teamId}/cycles`,
      },
      {
        key: "views",
        label: "Views",
        icon: Layers,
        value: teamEntities?.linked_entities.views,
        href: `/${workspaceSlug}/teams/${teamId}/views`,
      },
      {
        key: "pages",
        label: "Pages",
        icon: FileText,
        value: teamEntities?.linked_entities.pages,
        href: `/${workspaceSlug}/teams/${teamId}/pages`,
      },
    ],
    [teamId, teamEntities, workspaceSlug]
  );

  const TEAM_ENTITIES: TPropertyListItem[] = useMemo(
    () => [
      {
        key: "views",
        label: "Views",
        icon: Layers,
        value: teamEntities?.team_entities.views,
        href: `/${workspaceSlug}/teams/${teamId}/views`,
      },
      {
        key: "pages",
        label: "Pages",
        icon: FileText,
        value: teamEntities?.team_entities.pages,
        href: `/${workspaceSlug}/teams/${teamId}/pages`,
      },
    ],
    [teamId, teamEntities, workspaceSlug]
  );

  return (
    <div className="relative flex flex-col gap-y-2 px-6 divide-y divide-custom-border-100">
      <div className="py-2 flex flex-col">
        <div className="flex gap-2 justify-between">
          <span className="text-sm font-semibold">Properties</span>
          {teamEntitiesLoader === "mutation" ? <Spinner size={12} className="animate-spin" /> : null}
        </div>
        <TeamsPropertiesList>
          {TEAM_PROPERTIES.map((property) => (
            <TeamsPropertiesList.Item
              key={property.key}
              label={property.label}
              icon={property.icon}
              value={property.value}
            />
          ))}
        </TeamsPropertiesList>
      </div>
      {/* Linked entities */}
      <div className="pt-3">
        <div className="flex gap-4 text-sm">
          <span className="font-semibold">Linked entities</span>
          {linkedEntitiesCount === 0 ? <span className="text-custom-text-300">{linkedEntitiesCount}</span> : null}
        </div>
        {teamEntitiesLoader === "init-loader" ? (
          <TeamEntitiesLoader count={4} />
        ) : linkedEntitiesCount ? (
          <TeamsPropertiesList>
            {LINKED_ENTITIES.map((property) => (
              <TeamsPropertiesList.Item
                key={property.key}
                label={property.label}
                icon={property.icon}
                value={property.value}
                href={property.href}
              />
            ))}
          </TeamsPropertiesList>
        ) : null}
      </div>
      {/* Team's entities */}
      <div className="pt-3">
        <div className="flex gap-4 text-sm">
          <span className="font-semibold">Team&apos;s entities</span>
          {teamEntitiesCount === 0 ? <span className="text-custom-text-300">{teamEntitiesCount}</span> : null}
        </div>
        {teamEntitiesLoader === "init-loader" ? (
          <TeamEntitiesLoader count={2} />
        ) : teamEntitiesCount ? (
          <TeamsPropertiesList>
            {TEAM_ENTITIES.map((property) => (
              <TeamsPropertiesList.Item
                key={property.key}
                label={property.label}
                icon={property.icon}
                value={property.value}
                href={property.href}
              />
            ))}
          </TeamsPropertiesList>
        ) : null}
      </div>
    </div>
  );
});
