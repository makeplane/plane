import React, { FC, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// services
import projectService from "services/project.service";
// hooks
import useUser from "hooks/use-user";
// ui
import { Spinner } from "components/ui";
// components
import CommandPalette from "components/command-palette";
import { JoinProject } from "components/project";
// local components
import Container from "layouts/container";
import AppSidebar from "./app-sidebar";
import AppHeader from "./app-header";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

export type Meta = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  url?: string | null;
};

export interface AppLayoutProps {
  meta?: Meta;
  children: React.ReactNode;
  noPadding?: boolean;
  bg?: "primary" | "secondary";
  noHeader?: boolean;
  breadcrumbs?: JSX.Element;
  left?: JSX.Element;
  right?: JSX.Element;
}

const AppLayout: FC<AppLayoutProps> = ({
  meta,
  children,
  noPadding = false,
  bg = "primary",
  noHeader = false,
  breadcrumbs,
  left,
  right,
}) => {
  // states
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const [isJoiningProject, setIsJoiningProject] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // user info
  const { user } = useUser();
  // fetching Project Members information
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
              className={`w-full flex-grow ${noPadding ? "" : "p-5"} ${
                bg === "primary" ? "bg-primary" : bg === "secondary" ? "bg-secondary" : "bg-primary"
              }`}
            >
              {children}
            </div>
          ) : (
            <JoinProject isJoiningProject={isJoiningProject} handleJoin={handleJoin} />
          )}
        </main>
      </div>
    </Container>
  );
};

export default AppLayout;
