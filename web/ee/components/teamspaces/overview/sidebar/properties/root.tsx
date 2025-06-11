import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { BriefcaseIcon, FileText, Layers, Loader as Spinner, Users } from "lucide-react";
// ui
import { EUserWorkspaceRoles } from "@plane/constants";
import { ContrastIcon, LayersIcon } from "@plane/ui";
// components
import { MemberDropdown } from "@/components/dropdowns";
import { Props } from "@/components/icons/types";
// hooks
import { cn } from "@/helpers/common.helper";
// plane web hooks
import { useMember } from "@/hooks/store";
import { useTeamspaces } from "@/plane-web/hooks/store";
// local components
import { TeamsPropertiesList } from "./list";
import { TeamspaceEntitiesLoader } from "./loader";

type TTeamsOverviewSidebarPropertiesProps = {
  teamspaceId: string;
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
  const { teamspaceId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const {
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails },
  } = useMember();
  const { getTeamspaceById, getTeamspaceEntitiesById, getTeamspaceEntitiesLoaderById, updateTeamspace } =
    useTeamspaces();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId);
  const teamspaceEntities = getTeamspaceEntitiesById(teamspaceId);
  const teamspaceEntitiesLoader = getTeamspaceEntitiesLoaderById(teamspaceId);
  const linkedEntitiesCount = teamspaceEntities?.linked_entities.total;
  const teamspaceEntitiesCount = teamspaceEntities?.team_entities.total;
  const userIdsWithAdminOrMemberRole = useMemo(
    () =>
      workspaceMemberIds?.filter((userId) => {
        const memberDetails = getWorkspaceMemberDetails(userId);
        return memberDetails?.role === EUserWorkspaceRoles.GUEST ? false : true;
      }),
    [workspaceMemberIds, getWorkspaceMemberDetails]
  );

  if (!teamspace) return null;

  const handleTeamspaceLeadChange = useCallback(
    (val: string | null) => {
      if (val && val !== teamspace.lead_id) {
        updateTeamspace(workspaceSlug?.toString(), teamspaceId, { lead_id: val });
      } else {
        updateTeamspace(workspaceSlug?.toString(), teamspaceId, { lead_id: undefined });
      }
    },
    [teamspaceId, teamspace.lead_id, updateTeamspace, workspaceSlug]
  );

  const TEAM_PROPERTIES: TPropertyListItem[] = useMemo(
    () => [
      {
        key: "lead",
        label: "Lead",
        icon: Users,
        value: (
          <MemberDropdown
            value={teamspace.lead_id ?? null}
            memberIds={userIdsWithAdminOrMemberRole}
            onChange={handleTeamspaceLeadChange}
            multiple={false}
            buttonVariant="transparent-with-text"
            buttonContainerClassName={cn(
              "flex-shrink-0 w-full text-left",
              teamspace.lead_id ? "text-custom-text-200" : "text-custom-text-400"
            )}
            placeholder="Select team lead"
            showUserDetails
            disabled={!isEditingAllowed}
          />
        ),
      },
    ],
    [handleTeamspaceLeadChange, teamspace.lead_id, userIdsWithAdminOrMemberRole, isEditingAllowed]
  );

  const LINKED_ENTITIES: TPropertyListItem[] = useMemo(
    () => [
      {
        key: "issues",
        label: "Work items",
        icon: LayersIcon,
        value: teamspaceEntities?.linked_entities.issues,
        href: `/${workspaceSlug}/teamspaces/${teamspaceId}/issues`,
      },
      {
        key: "cycles",
        label: "Cycles",
        icon: ContrastIcon,
        value: teamspaceEntities?.linked_entities.cycles,
        href: `/${workspaceSlug}/teamspaces/${teamspaceId}/cycles`,
      },
    ],
    [teamspaceId, teamspaceEntities, workspaceSlug]
  );

  const TEAM_ENTITIES: TPropertyListItem[] = useMemo(
    () => [
      {
        key: "views",
        label: "Views",
        icon: Layers,
        value: teamspaceEntities?.team_entities.views,
        href: `/${workspaceSlug}/teamspaces/${teamspaceId}/views`,
      },
      {
        key: "pages",
        label: "Pages",
        icon: FileText,
        value: teamspaceEntities?.team_entities.pages,
        href: `/${workspaceSlug}/teamspaces/${teamspaceId}/pages`,
      },
    ],
    [teamspaceId, teamspaceEntities, workspaceSlug]
  );

  return (
    <div className="relative flex flex-col gap-y-2 px-6 divide-y divide-custom-border-100">
      <div className="py-2 flex flex-col">
        <div className="flex gap-2 justify-between">
          <span className="text-sm font-semibold">Properties</span>
          {teamspaceEntitiesLoader === "mutation" ? <Spinner size={12} className="animate-spin" /> : null}
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
        {teamspaceEntitiesLoader === "init-loader" ? (
          <TeamspaceEntitiesLoader count={4} />
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
      {/* Teamspace's entities */}
      <div className="pt-3">
        <div className="flex gap-4 text-sm">
          <span className="font-semibold">Entities in the teamspace</span>
          {teamspaceEntitiesCount === 0 ? <span className="text-custom-text-300">{teamspaceEntitiesCount}</span> : null}
        </div>
        {teamspaceEntitiesLoader === "init-loader" ? (
          <TeamspaceEntitiesLoader count={2} />
        ) : teamspaceEntitiesCount ? (
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
