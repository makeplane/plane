import React, { useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// services
import projectService from "services/project.service";
// hooks
import useProjects from "hooks/use-projects";
import useWorkspaces from "hooks/use-workspaces";
import useUserAuth from "hooks/use-user-auth";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import { JoinProjectModal } from "components/project/join-project-modal";
import { DeleteProjectModal, SingleProjectCard } from "components/project";
// ui
import { EmptyState, Icon, Loader, PrimaryButton } from "components/ui";
import { Breadcrumbs, BreadcrumbItem } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// images
import emptyProject from "public/empty-state/project.svg";
// types
import type { NextPage } from "next";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";

const ProjectsPage: NextPage = () => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const [query, setQuery] = useState("");

  const { user } = useUserAuth();
  // context data
  const { activeWorkspace } = useWorkspaces();
  const { projects } = useProjects();
  // states
  const [deleteProject, setDeleteProject] = useState<string | null>(null);
  const [selectedProjectToJoin, setSelectedProjectToJoin] = useState<string | null>(null);

  const filteredProjectList =
    query === ""
      ? projects
      : projects?.filter(
          (project) =>
            project.name.toLowerCase().includes(query.toLowerCase()) ||
            project.identifier.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(activeWorkspace?.name ?? "Workspace", 32)} Projects`}
            unshrinkTitle={false}
          />
        </Breadcrumbs>
      }
      right={
        <div className="flex items-center gap-3">
          <div className="flex w-full gap-1 items-center justify-start rounded-md px-2 py-1.5 border border-custom-border-300 bg-custom-background-90">
            <Icon iconName="search" className="!text-xl !leading-5 !text-custom-sidebar-text-400" />
            <input
              className="w-full  border-none bg-transparent text-xs text-custom-text-200 focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
            />
          </div>

          <PrimaryButton
            className="flex items-center gap-2 flex-shrink-0"
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "p" });
              document.dispatchEvent(e);
            }}
          >
            <PlusIcon className="h-4 w-4" />
            Add Project
          </PrimaryButton>
        </div>
      }
    >
      <JoinProjectModal
        data={projects?.find((item) => item.id === selectedProjectToJoin)}
        onClose={() => setSelectedProjectToJoin(null)}
        onJoin={async () => {
          const project = projects?.find((item) => item.id === selectedProjectToJoin);
          if (!project) return;

          await projectService
            .joinProject(workspaceSlug as string, {
              project_ids: [project.id],
            })
            .then(async () => {
              mutate(PROJECT_MEMBERS(project.id));
              setSelectedProjectToJoin(null);
            })
            .catch(() => {
              setSelectedProjectToJoin(null);
            });
        }}
      />
      <DeleteProjectModal
        isOpen={!!deleteProject}
        onClose={() => setDeleteProject(null)}
        data={projects?.find((item) => item.id === deleteProject) ?? null}
        user={user}
      />
      {filteredProjectList ? (
        <div className="h-full w-full overflow-hidden">
          {filteredProjectList.length > 0 ? (
            <div className="h-full p-8 overflow-y-auto">
              <div className="grid grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjectList.map((project) => (
                  <SingleProjectCard
                    key={project.id}
                    project={project}
                    setToJoinProject={setSelectedProjectToJoin}
                    setDeleteProject={setDeleteProject}
                  />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              image={emptyProject}
              title="No projects yet"
              description="Get started by creating your first project"
              primaryButton={{
                icon: <PlusIcon className="h-4 w-4" />,
                text: "New Project",
                onClick: () => {
                  const e = new KeyboardEvent("keydown", {
                    key: "p",
                  });
                  document.dispatchEvent(e);
                },
              }}
            />
          )}
        </div>
      ) : (
        <Loader className="grid grid-cols-3 gap-4">
          <Loader.Item height="100px" />
          <Loader.Item height="100px" />
          <Loader.Item height="100px" />
          <Loader.Item height="100px" />
          <Loader.Item height="100px" />
          <Loader.Item height="100px" />
        </Loader>
      )}
    </WorkspaceAuthorizationLayout>
  );
};

export default ProjectsPage;
