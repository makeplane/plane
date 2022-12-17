import React, { useState } from "react";
// next
import type { NextPage } from "next";
// hooks
import useUser from "lib/hooks/useUser";
// hoc
import withAuth from "lib/hoc/withAuthWrapper";
// layouts
import AppLayout from "layouts/app-layout";
// components
import ProjectMemberInvitations from "components/project/memberInvitations";
import ConfirmProjectDeletion from "components/project/confirm-project-deletion";
// ui
import {
  Button,
  Spinner,
  HeaderButton,
  Breadcrumbs,
  BreadcrumbItem,
  EmptySpace,
  EmptySpaceItem,
} from "ui";
// services
import projectService from "lib/services/project.service";
// icons
import { ClipboardDocumentListIcon, PlusIcon } from "@heroicons/react/24/outline";

const Projects: NextPage = () => {
  const [deleteProject, setDeleteProject] = useState<string | null>(null);
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);

  const { projects, activeWorkspace, mutateProjects } = useUser();

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
    projectService
      .joinProject((activeWorkspace as any)?.slug, { project_ids: invitationsRespond })
      .then(async (res: any) => {
        console.log(res);
        setInvitationsRespond([]);
        await mutateProjects();
      })
      .catch((err: any) => {
        console.log(err);
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
            <div className="h-full w-full grid place-items-center px-4 sm:px-0">
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
                      <pre className="inline bg-gray-100 px-2 py-1 rounded">Ctrl/Command + P</pre>{" "}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((item) => (
                  <ProjectMemberInvitations
                    key={item.id}
                    project={item}
                    slug={(activeWorkspace as any).slug}
                    invitationsRespond={invitationsRespond}
                    handleInvitation={handleInvitation}
                    setDeleteProject={setDeleteProject}
                  />
                ))}
              </div>
              {invitationsRespond.length > 0 && (
                <div className="flex justify-between mt-4">
                  <Button onClick={submitInvitations}>Submit</Button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      )}
    </AppLayout>
  );
};

export default withAuth(Projects);
