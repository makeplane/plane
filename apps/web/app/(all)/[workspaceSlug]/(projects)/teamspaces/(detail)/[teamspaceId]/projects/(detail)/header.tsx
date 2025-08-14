"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Briefcase } from "lucide-react";
// plane imports
import { ETeamspaceNavigationItem, EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles, ICustomSearchSelectOption } from "@plane/types";
import { BreadcrumbNavigationSearchDropdown, Breadcrumbs, Header, Loader, TeamsIcon } from "@plane/ui";
// components
import { BreadcrumbLink, Logo, SwitcherLabel } from "@/components/common";
// plane web hooks
import { useProject, useUserPermissions } from "@/hooks/store";
// plane web hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { TeamspaceProjectDetailHeaderActions } from "@/plane-web/components/teamspaces/headers/detail-header/work-items";
import { useTeamspaces } from "@/plane-web/hooks/store";

export const TeamspaceProjectDetailHeader: React.FC = observer(() => {
  // router
  const { workspaceSlug, teamspaceId, projectId } = useParams();
  // store hooks
  const { loader, getTeamspaceById } = useTeamspaces();
  const { filteredProjectIds, getPartialProjectById } = useProject();
  const router = useAppRouter();
  // hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId?.toString());
  // derived values
  const switcherOptions = filteredProjectIds?.length
    ? (filteredProjectIds
        .map((projectId) => {
          const project = getPartialProjectById(projectId.toString());
          return {
            value: projectId,
            query: project?.name,
            content: <SwitcherLabel name={project?.name} logo_props={project?.logo_props} LabelIcon={Briefcase} />,
          };
        })
        .filter((option) => option !== undefined) as ICustomSearchSelectOption[])
    : [];

  const currentProjectDetails = getPartialProjectById(projectId?.toString());

  const hasAdminLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug?.toString()
  );

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-4">
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/teamspaces`}
                  label="Teamspaces"
                  icon={<TeamsIcon className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.Item
              component={
                <>
                  {loader === "init-loader" ? (
                    <Loader.Item height="20px" width="140px" />
                  ) : teamspace ? (
                    <BreadcrumbLink
                      href={`/${workspaceSlug}/teamspaces/${teamspaceId}`}
                      label={teamspace.name}
                      icon={teamspace.logo_props && <Logo logo={teamspace.logo_props} />}
                    />
                  ) : null}
                </>
              }
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/teamspaces/${teamspaceId}/projects`}
                  label="Projects"
                  icon={<Briefcase className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbNavigationSearchDropdown
                  selectedItem={projectId?.toString()}
                  navigationItems={switcherOptions}
                  onChange={(value: string) => {
                    router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}/projects/${value}`);
                  }}
                  title={currentProjectDetails?.name}
                  icon={currentProjectDetails?.logo_props && <Logo logo={currentProjectDetails?.logo_props} />}
                  isLast
                />
              }
              showSeparator={false}
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <TeamspaceProjectDetailHeaderActions
          key={ETeamspaceNavigationItem.PROJECTS}
          teamspaceId={teamspaceId?.toString()}
          isEditingAllowed={hasAdminLevelPermissions}
          projectId={projectId?.toString()}
        />
      </Header.RightItem>
    </Header>
  );
});
