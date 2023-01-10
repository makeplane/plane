import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// layouts
import Container from "layouts/container";
import Sidebar from "layouts/navbar/main-sidebar";
import Header from "layouts/navbar/header";
// services
import projectService from "lib/services/project.service";
// hooks
import useUser from "lib/hooks/useUser";
// fetch keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";
// ui
import { Button, Spinner } from "ui";
// components
import CommandPalette from "components/command-palette";
// types
import type { Props } from "./types";

const AppLayout: React.FC<Props> = ({
  meta,
  children,
  noPadding = false,
  bg = "primary",
  noHeader = false,
  breadcrumbs,
  left,
  right,
}) => {
  const [isJoiningProject, setIsJoiningProject] = useState(false);
  const [toggleSidebar, setToggleSidebar] = useState(false);

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

  return (
    <Container meta={meta}>
      <CommandPalette />
      <div className="flex h-screen w-full overflow-x-hidden">
        <Sidebar toggleSidebar={toggleSidebar} setToggleSidebar={setToggleSidebar} />
        <main className="flex h-screen w-full min-w-0 flex-col overflow-y-auto">
          {noHeader ? null : (
            <Header
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
          ) : projectMembers?.find((member) => member.member.id === user?.id) || !projectId ? (
            <div
              className={`w-full flex-grow ${noPadding ? "" : "p-5"} ${
                bg === "primary" ? "bg-primary" : bg === "secondary" ? "bg-secondary" : "bg-primary"
              }`}
            >
              {children}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="space-y-4 text-center">
                <h1 className="text-2xl font-bold">You are not a member of this project</h1>
                <p className="mx-auto w-full text-sm md:w-3/4">
                  You are not a member of this project, but you can join this project by clicking
                  the button below.
                </p>
                <div>
                  <Button
                    type="button"
                    disabled={isJoiningProject}
                    onClick={() => {
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
                    }}
                  >
                    Click to join
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </Container>
  );
};

export default AppLayout;
