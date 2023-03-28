import React, { FC, useState } from "react";

import { useRouter } from "next/router";
import Link from "next/link";

import useSWR from "swr";

// services
import projectService from "services/project.service";
// ui
import { PrimaryButton, Spinner } from "components/ui";
// icon
import { LayerDiagonalIcon } from "components/icons";
// components
import { NotAuthorizedView } from "components/core";
import { CommandPalette } from "components/command-palette";
import { JoinProject } from "components/project";
// local components
import Container from "layouts/container";
import AppSidebar from "layouts/app-layout/app-sidebar";
import AppHeader from "layouts/app-layout/app-header";
// types
import { UserAuth } from "types";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";
import SettingsNavbar from "layouts/settings-navbar";

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
  settingsLayout?: boolean;
  memberType?: UserAuth;
};

const AppLayout: FC<AppLayoutProps> = ({
  meta,
  children,
  noPadding = false,
  bg = "primary",
  noHeader = false,
  breadcrumbs,
  left,
  right,
  settingsLayout = false,
  memberType,
}) => {
  // states
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const [isJoiningProject, setIsJoiningProject] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

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
  const isMember =
    !projectId ||
    memberType?.isOwner ||
    memberType?.isMember ||
    memberType?.isViewer ||
    memberType?.isGuest;

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
                  <PrimaryButton className="flex items-center gap-1">
                    <LayerDiagonalIcon height={16} width={16} color="white" /> Go to Issues
                  </PrimaryButton>
                </Link>
              ) : (
                (memberType?.isViewer || memberType?.isGuest) &&
                workspaceSlug && (
                  <Link href={`/${workspaceSlug}`}>
                    <PrimaryButton className="flex items-center gap-1">
                      <LayerDiagonalIcon height={16} width={16} color="white" /> Go to workspace
                    </PrimaryButton>
                  </Link>
                )
              )
            }
          />
        ) : (
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
                className={`flex w-full flex-grow flex-col ${
                  noPadding ? "" : settingsLayout ? "p-8 lg:px-28" : "p-8"
                } ${
                  bg === "primary"
                    ? "bg-primary"
                    : bg === "secondary"
                    ? "bg-secondary"
                    : "bg-primary"
                }`}
              >
                {settingsLayout && (
                  <div className="mb-12 space-y-6">
                    <div>
                      <h3 className="text-3xl font-semibold">
                        {projectId ? "Project" : "Workspace"} Settings
                      </h3>
                      <p className="mt-1 text-gray-600">
                        This information will be displayed to every member of the project.
                      </p>
                    </div>
                    <SettingsNavbar />
                  </div>
                )}
                {children}
              </div>
            ) : (
              <JoinProject isJoiningProject={isJoiningProject} handleJoin={handleJoin} />
            )}
          </main>
        )}
      </div>
    </Container>
  );
};

export default AppLayout;
