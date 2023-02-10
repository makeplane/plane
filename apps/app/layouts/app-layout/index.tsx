import React, { FC, useState } from "react";

import { useRouter } from "next/router";
import Link from "next/link";

import useSWR from "swr";

// services
import projectService from "services/project.service";
// hooks
import useUser from "hooks/use-user";
// ui
import { Button, Spinner } from "components/ui";
// components
import { NotAuthorizedView } from "components/core";
import { CommandPalette } from "components/command-palette";
import { JoinProject } from "components/project";
// local components
import Container from "layouts/container";
import AppSidebar from "layouts/app-layout/app-sidebar";
import AppHeader from "layouts/app-layout/app-header";
import SettingsSidebar from "layouts/settings-layout/settings-sidebar";
// types
import { UserAuth } from "types";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Meta = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  url?: string | null;
};

type AppLayoutProps = {
  meta?: Meta;
  children: React.ReactNode;
  noPadding?: boolean;
  bg?: "primary" | "secondary";
  noHeader?: boolean;
  breadcrumbs?: JSX.Element;
  left?: JSX.Element;
  right?: JSX.Element;
  settingsLayout?: "project" | "workspace";
  memberType?: UserAuth;
};

const workspaceLinks: (wSlug: string) => Array<{
  label: string;
  href: string;
}> = (workspaceSlug) => [
  {
    label: "General",
    href: `/${workspaceSlug}/settings`,
  },
  {
    label: "Members",
    href: `/${workspaceSlug}/settings/members`,
  },
  {
    label: "Billing & Plans",
    href: `/${workspaceSlug}/settings/billing`,
  },
];

const sidebarLinks: (
  wSlug?: string,
  pId?: string
) => Array<{
  label: string;
  href: string;
}> = (workspaceSlug, projectId) => [
  {
    label: "General",
    href: `/${workspaceSlug}/projects/${projectId}/settings`,
  },
  {
    label: "Control",
    href: `/${workspaceSlug}/projects/${projectId}/settings/control`,
  },
  {
    label: "Members",
    href: `/${workspaceSlug}/projects/${projectId}/settings/members`,
  },
  {
    label: "Features",
    href: `/${workspaceSlug}/projects/${projectId}/settings/features`,
  },
  {
    label: "States",
    href: `/${workspaceSlug}/projects/${projectId}/settings/states`,
  },
  {
    label: "Labels",
    href: `/${workspaceSlug}/projects/${projectId}/settings/labels`,
  },
];

const AppLayout: FC<AppLayoutProps> = ({
  meta,
  children,
  noPadding = false,
  bg = "primary",
  noHeader = false,
  breadcrumbs,
  left,
  right,
  settingsLayout,
  memberType,
}) => {
  // states
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const [isJoiningProject, setIsJoiningProject] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUser();

  const { data: projectMembers, mutate: projectMembersMutate } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null,
    {
      shouldRetryOnError: false,
    }
  );
  // flags
  const isMember = projectMembers?.find((member) => member.member.id === user?.id) || !projectId;

  const handleJoin = () => {
    setIsJoiningProject(true);
    projectService
      .joinProject(workspaceSlug as string, {
        project_ids: [projectId as string],
      })
      .then(() => {
        setIsJoiningProject(false);
        projectMembersMutate();
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <Container meta={meta}>
      <CommandPalette />
      <div className="flex h-screen w-full overflow-x-hidden">
        <AppSidebar toggleSidebar={toggleSidebar} setToggleSidebar={setToggleSidebar} />
        {settingsLayout && (memberType?.isGuest || memberType?.isViewer) ? (
          <NotAuthorizedView
            actionButton={
              (memberType?.isViewer || memberType?.isGuest) && projectId ? (
                <Link href={`/${workspaceSlug}/projects/${projectId}/issues`}>
                  <Button size="sm" theme="secondary">
                    Go to Issues
                  </Button>
                </Link>
              ) : (
                (memberType?.isViewer || memberType?.isGuest) &&
                workspaceSlug && (
                  <Link href={`/${workspaceSlug}`}>
                    <Button size="sm" theme="secondary">
                      Go to workspace
                    </Button>
                  </Link>
                )
              )
            }
          />
        ) : (
          <>
            {settingsLayout && (
              <SettingsSidebar
                links={
                  settingsLayout === "workspace"
                    ? workspaceLinks(workspaceSlug as string)
                    : sidebarLinks(workspaceSlug as string, projectId as string)
                }
              />
            )}
            <main className="flex h-screen w-full min-w-0 flex-col overflow-y-auto">
              {!noHeader && (
                <AppHeader
                  breadcrumbs={breadcrumbs}
                  left={left}
                  right={right}
                  setToggleSidebar={setToggleSidebar}
                />
              )}
              {projectId && !projectMembers ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Spinner />
                </div>
              ) : isMember ? (
                <div
                  className={`w-full flex-grow ${
                    noPadding ? "" : settingsLayout ? "p-5 pb-5 lg:px-16 lg:pt-10" : "p-5"
                  } ${
                    bg === "primary"
                      ? "bg-primary"
                      : bg === "secondary"
                      ? "bg-secondary"
                      : "bg-primary"
                  }`}
                >
                  {children}
                </div>
              ) : (
                <JoinProject isJoiningProject={isJoiningProject} handleJoin={handleJoin} />
              )}
            </main>
          </>
        )}
      </div>
    </Container>
  );
};

export default AppLayout;
