import React, { useState } from "react";

import type { NextPage } from "next";
import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectService from "lib/services/project.service";
import workspaceService from "lib/services/workspace.service";
// constants
import { WORKSPACE_DETAILS, PROJECTS_LIST } from "constants/fetch-keys";
// layouts
import AppLayout from "layouts/app-layout";
// components
import ProjectMemberInvitations from "components/project/member-invitations";
import ConfirmProjectDeletion from "components/project/confirm-project-deletion";
// ui
import {
  Button,
  HeaderButton,
  Breadcrumbs,
  BreadcrumbItem,
  EmptySpace,
  EmptySpaceItem,
  Loader,
} from "ui";
// icons
import { ClipboardDocumentListIcon, PlusIcon } from "@heroicons/react/24/outline";

const Projects: NextPage = () => {
  const [deleteProject, setDeleteProject] = useState<string | null>(null);
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);

  const {
    query: { workspaceSlug },
  } = useRouter();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const { data: projects, mutate: mutateProjects } = useSWR(
    workspaceSlug ? PROJECTS_LIST(workspaceSlug as string) : null,
    () => (workspaceSlug ? projectService.getProjects(workspaceSlug as string) : null)
  );

  const handleInvitation = (project_invitation: any, action: "accepted" | "withdraw") => {
    if (action === "accepted") {
      setInvitationsRespond((prevData) => {
        return [...prevData, project_invitation.id];
      });
    } else if (action === "withdraw") {
      setInvitationsRespond((prevData) => {
        return prevData.filter((item: string) => item !== project_invitation.id);
      });
    }
  };

  const submitInvitations = () => {
    if (!workspaceSlug) return;
    projectService
      .joinProject(workspaceSlug as string, { project_ids: invitationsRespond })
      .then(async () => {
        setInvitationsRespond([]);
        await mutateProjects();
      })
      .catch((err: any) => {
        console.error(err);
      });
  };

  return (
    <AppLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title={`${activeWorkspace?.name ?? "Workspace"} Projects`} />
        </Breadcrumbs>
      }
      right={
        <HeaderButton
          Icon={PlusIcon}
          label="Add Project"
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "p", ctrlKey: true });
            document.dispatchEvent(e);
          }}
        />
      }
    >
      <ConfirmProjectDeletion
        isOpen={!!deleteProject}
        onClose={() => setDeleteProject(null)}
        data={projects?.find((item) => item.id === deleteProject) ?? null}
      />
      {projects ? (
        <>
          {projects.length === 0 ? (
            <div className="grid h-full w-full place-items-center px-4 sm:px-0">
              <EmptySpace
                title="You don't have any project yet."
                description="Projects are a collection of issues. They can be used to represent the development work for a product, project, or service."
                Icon={ClipboardDocumentListIcon}
              >
                <EmptySpaceItem
                  title="Create a new project"
                  description={
                    <span>
                      Use{" "}
                      <pre className="inline rounded bg-gray-100 px-2 py-1">Ctrl/Command + P</pre>{" "}
                      shortcut to create a new project
                    </span>
                  }
                  Icon={PlusIcon}
                  action={() => {
                    const e = new KeyboardEvent("keydown", { key: "p", ctrlKey: true });
                    document.dispatchEvent(e);
                  }}
                />
              </EmptySpace>
            </div>
          ) : (
            <div className="h-full w-full space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((item) => (
                  <ProjectMemberInvitations
                    key={item.id}
                    project={item}
                    slug={(activeWorkspace as any)?.slug}
                    invitationsRespond={invitationsRespond}
                    handleInvitation={handleInvitation}
                    setDeleteProject={setDeleteProject}
                  />
                ))}
              </div>
              {invitationsRespond.length > 0 && (
                <div className="mt-4 flex justify-between">
                  <Button onClick={submitInvitations}>Submit</Button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <Loader className="grid grid-cols-3 gap-4">
          <Loader.Item height="100px"></Loader.Item>
          <Loader.Item height="100px"></Loader.Item>
          <Loader.Item height="100px"></Loader.Item>
          <Loader.Item height="100px"></Loader.Item>
          <Loader.Item height="100px"></Loader.Item>
          <Loader.Item height="100px"></Loader.Item>
        </Loader>
      )}
    </AppLayout>
  );
};

export default Projects;
