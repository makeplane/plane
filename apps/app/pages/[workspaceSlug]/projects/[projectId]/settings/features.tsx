import React from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import projectService from "services/project.service";
import trackEventServices from "services/track-event.service";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// hooks
import useToast from "hooks/use-toast";
// ui
import { SecondaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { ContrastIcon, PeopleGroupIcon, ViewListIcon } from "components/icons";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
// types
import { IProject } from "types";
import type { NextPage } from "next";
// fetch-keys
import { PROJECTS_LIST, PROJECT_DETAILS } from "constants/fetch-keys";

const FeaturesSettings: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const handleSubmit = async (formData: Partial<IProject>) => {
    if (!workspaceSlug || !projectId) return;

    mutate<IProject>(
      PROJECT_DETAILS(projectId as string),
      (prevData) => ({ ...(prevData as IProject), ...formData }),
      false
    );

    mutate<IProject[]>(
      PROJECTS_LIST(workspaceSlug as string),
      (prevData) =>
        prevData?.map((p) => {
          if (p.id === projectId)
            return {
              ...p,
              ...formData,
            };

          return p;
        }),
      false
    );

    await projectService
      .updateProject(workspaceSlug as string, projectId as string, formData)
      .then((res) => {
        mutate(PROJECT_DETAILS(projectId as string));
        mutate(PROJECTS_LIST(workspaceSlug as string));
        setToastAlert({
          title: "Success!",
          type: "success",
          message: "Project features updated successfully.",
        });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${projectDetails?.name ?? "Project"}`}
            link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
          />
          <BreadcrumbItem title="Features Settings" />
        </Breadcrumbs>
      }
    >
      <section className="space-y-8">
        <h3 className="text-2xl font-semibold">Features</h3>
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-x-8 gap-y-2 rounded-[10px] border border-brand-base bg-brand-surface-1 p-5">
            <div className="flex items-start gap-3">
              <ContrastIcon color="#3F76FF" width={28} height={28} className="flex-shrink-0" />
              <div>
                <h4 className="text-xl font-semibold">Cycles</h4>
                <p className="text-brand-secondary">
                  Cycles are enabled for all the projects in this workspace. Access them from the
                  navigation bar.
                </p>
              </div>
            </div>
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                projectDetails?.cycle_view ? "bg-green-500" : "bg-brand-surface-2"
              }`}
              role="switch"
              aria-checked={projectDetails?.cycle_view}
              onClick={() => {
                trackEventServices.trackMiscellaneousEvent(
                  {
                    workspaceId: (projectDetails?.workspace as any)?.id,
                    workspaceSlug,
                    projectId,
                    projectIdentifier: projectDetails?.identifier,
                    projectName: projectDetails?.name,
                  },
                  !projectDetails?.cycle_view ? "TOGGLE_CYCLE_ON" : "TOGGLE_CYCLE_OFF"
                );
                handleSubmit({ cycle_view: !projectDetails?.cycle_view });
              }}
            >
              <span className="sr-only">Use cycles</span>
              <span
                aria-hidden="true"
                className={`inline-block h-5 w-5 transform rounded-full bg-brand-surface-1 shadow ring-0 transition duration-200 ease-in-out ${
                  projectDetails?.cycle_view ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between gap-x-8 gap-y-2 rounded-[10px] border border-brand-base bg-brand-surface-1 p-5">
            <div className="flex items-start gap-3">
              <PeopleGroupIcon color="#FF6B00" width={28} height={28} className="flex-shrink-0" />
              <div>
                <h4 className="-mt-1.5 text-xl font-semibold">Modules</h4>
                <p className="text-brand-secondary">
                  Modules are enabled for all the projects in this workspace. Access it from the
                  navigation bar.
                </p>
              </div>
            </div>
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                projectDetails?.module_view ? "bg-green-500" : "bg-brand-surface-2"
              }`}
              role="switch"
              aria-checked={projectDetails?.module_view}
              onClick={() => {
                trackEventServices.trackMiscellaneousEvent(
                  {
                    workspaceId: (projectDetails?.workspace as any)?.id,
                    workspaceSlug,
                    projectId,
                    projectIdentifier: projectDetails?.identifier,
                    projectName: projectDetails?.name,
                  },
                  !projectDetails?.module_view ? "TOGGLE_MODULE_ON" : "TOGGLE_MODULE_OFF"
                );
                handleSubmit({ module_view: !projectDetails?.module_view });
              }}
            >
              <span className="sr-only">Use cycles</span>
              <span
                aria-hidden="true"
                className={`inline-block h-5 w-5 transform rounded-full bg-brand-surface-1 shadow ring-0 transition duration-200 ease-in-out ${
                  projectDetails?.module_view ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between gap-x-8 gap-y-2 rounded-[10px] border border-brand-base bg-brand-surface-1 p-5">
            <div className="flex items-start gap-3">
              <ViewListIcon color="#05C3FF" width={28} height={28} className="flex-shrink-0" />
              <div>
                <h4 className="-mt-1.5 text-xl font-semibold">Views</h4>
                <p className="text-brand-secondary">
                  Views are enabled for all the projects in this workspace. Access it from the
                  navigation bar.
                </p>
              </div>
            </div>
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                projectDetails?.issue_views_view ? "bg-green-500" : "bg-brand-surface-2"
              }`}
              role="switch"
              aria-checked={projectDetails?.issue_views_view}
              onClick={() => {
                trackEventServices.trackMiscellaneousEvent(
                  {
                    workspaceId: (projectDetails?.workspace as any)?.id,
                    workspaceSlug,
                    projectId,
                    projectIdentifier: projectDetails?.identifier,
                    projectName: projectDetails?.name,
                  },
                  !projectDetails?.issue_views_view ? "TOGGLE_VIEW_ON" : "TOGGLE_VIEW_OFF"
                );
                handleSubmit({ issue_views_view: !projectDetails?.issue_views_view });
              }}
            >
              <span className="sr-only">Use views</span>
              <span
                aria-hidden="true"
                className={`inline-block h-5 w-5 transform rounded-full bg-brand-surface-1 shadow ring-0 transition duration-200 ease-in-out ${
                  projectDetails?.issue_views_view ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between gap-x-8 gap-y-2 rounded-[10px] border border-brand-base bg-brand-surface-1 p-5">
            <div className="flex items-start gap-3">
              <DocumentTextIcon color="#FCBE1D" width={28} height={28} className="flex-shrink-0" />
              <div>
                <h4 className="text-xl font-semibold">Pages</h4>
                <p className="text-brand-secondary">
                  Pages are enabled for all the projects in this workspace. Access them from the
                  navigation bar.
                </p>
              </div>
            </div>
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                projectDetails?.page_view ? "bg-green-500" : "bg-brand-surface-2"
              }`}
              role="switch"
              aria-checked={projectDetails?.page_view}
              onClick={() => {
                trackEventServices.trackMiscellaneousEvent(
                  {
                    workspaceId: (projectDetails?.workspace as any)?.id,
                    workspaceSlug,
                    projectId,
                    projectIdentifier: projectDetails?.identifier,
                    projectName: projectDetails?.name,
                  },
                  !projectDetails?.page_view ? "TOGGLE_PAGES_ON" : "TOGGLE_PAGES_OFF"
                );
                handleSubmit({ page_view: !projectDetails?.page_view });
              }}
            >
              <span className="sr-only">Use cycles</span>
              <span
                aria-hidden="true"
                className={`inline-block h-5 w-5 transform rounded-full bg-brand-surface-1 shadow ring-0 transition duration-200 ease-in-out ${
                  projectDetails?.page_view ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://plane.so/" target="_blank" rel="noreferrer">
            <SecondaryButton outline>Plane is open-source, view Roadmap</SecondaryButton>
          </a>
          <a href="https://github.com/makeplane/plane" target="_blank" rel="noreferrer">
            <SecondaryButton outline>Star us on GitHub</SecondaryButton>
          </a>
        </div>
      </section>
    </ProjectAuthorizationWrapper>
  );
};

export default FeaturesSettings;
