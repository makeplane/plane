"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";
// ui
import { Breadcrumbs, Header, Loader, TeamsIcon } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
import { PageEditInformationPopover } from "@/components/pages";
// helpers
import { getPageName } from "@/helpers/page.helper";
// plane web hooks
import { useTeams, useTeamPages } from "@/plane-web/hooks/store";

export const TeamPageDetailHeader: React.FC = observer(() => {
  // router
  const { workspaceSlug, teamId, pageId } = useParams();
  // store hooks
  const { loader, getTeamById } = useTeams();
  const { getTeamPagesLoader, getPageById } = useTeamPages();
  // derived values
  const team = getTeamById(teamId?.toString());
  const teamPageLoader = getTeamPagesLoader(teamId?.toString());
  const page = team && pageId ? getPageById(team.id, pageId.toString()) : null;

  if (!workspaceSlug) return;
  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-4">
          {/* bread crumps */}
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/teams`}
                  label="Teams"
                  icon={<TeamsIcon className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <>
                  {loader === "init-loader" ? (
                    <Loader.Item height="20px" width="140px" />
                  ) : team ? (
                    <BreadcrumbLink
                      href={`/${workspaceSlug}/teams/${teamId}`}
                      label={team.name}
                      icon={team.logo_props && <Logo logo={team.logo_props} />}
                    />
                  ) : null}
                </>
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/teams/${teamId}/pages`}
                  label="Pages"
                  icon={<FileText className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <>
                  {teamPageLoader === "init-loader" && !page ? (
                    <Loader.Item height="20px" width="140px" />
                  ) : page ? (
                    <BreadcrumbLink
                      label={getPageName(page.name)}
                      icon={
                        page.logo_props?.in_use ? (
                          <Logo logo={page.logo_props} />
                        ) : (
                          <FileText className="h-4 w-4 text-custom-text-200" />
                        )
                      }
                    />
                  ) : null}
                </>
              }
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>{page && <PageEditInformationPopover page={page} />}</Header.RightItem>
    </Header>
  );
});
