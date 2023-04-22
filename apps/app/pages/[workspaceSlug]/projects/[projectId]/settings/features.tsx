import React from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import projectService from "services/project.service";
import trackEventServices, { MiscellaneousEventType } from "services/track-event.service";
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

const featuresList = [
  {
    title: "Cycles",
    description:
      "Cycles are enabled for all the projects in this workspace. Access them from the sidebar.",
    icon: <ContrastIcon color="#3f76ff" width={28} height={28} className="flex-shrink-0" />,
    property: "cycle_view",
  },
  {
    title: "Modules",
    description:
      "Modules are enabled for all the projects in this workspace. Access it from the sidebar.",
    icon: <PeopleGroupIcon color="#ff6b00" width={28} height={28} className="flex-shrink-0" />,
    property: "module_view",
  },
  {
    title: "Views",
    description:
      "Views are enabled for all the projects in this workspace. Access it from the sidebar.",
    icon: <ViewListIcon color="#05c3ff" width={28} height={28} className="flex-shrink-0" />,
    property: "issue_views_view",
  },
  {
    title: "Pages",
    description:
      "Pages are enabled for all the projects in this workspace. Access it from the sidebar.",
    icon: <DocumentTextIcon color="#fcbe1d" width={28} height={28} className="flex-shrink-0" />,
    property: "page_view",
  },
];

const getEventType = (feature: string, toggle: boolean): MiscellaneousEventType => {
  switch (feature) {
    case "Cycles":
      return toggle ? "TOGGLE_CYCLE_ON" : "TOGGLE_CYCLE_OFF";
    case "Modules":
      return toggle ? "TOGGLE_MODULE_ON" : "TOGGLE_MODULE_OFF";
    case "Views":
      return toggle ? "TOGGLE_VIEW_ON" : "TOGGLE_VIEW_OFF";
    case "Pages":
      return toggle ? "TOGGLE_PAGES_ON" : "TOGGLE_PAGES_OFF";
    default:
      return toggle ? "TOGGLE_PAGES_ON" : "TOGGLE_PAGES_OFF";
  }
};

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
          {featuresList.map((feature) => (
            <div
              key={feature.property}
              className="flex items-center justify-between gap-x-8 gap-y-2 rounded-[10px] border border-brand-base bg-brand-base p-5"
            >
              <div className="flex items-start gap-3">
                {feature.icon}
                <div>
                  <h4 className="text-lg font-semibold">{feature.title}</h4>
                  <p className="text-sm text-brand-secondary">{feature.description}</p>
                </div>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  projectDetails?.[feature.property as keyof IProject]
                    ? "bg-green-500"
                    : "bg-brand-surface-2"
                }`}
                role="switch"
                aria-checked={projectDetails?.[feature.property as keyof IProject]}
                onClick={() => {
                  trackEventServices.trackMiscellaneousEvent(
                    {
                      workspaceId: (projectDetails?.workspace as any)?.id,
                      workspaceSlug,
                      projectId,
                      projectIdentifier: projectDetails?.identifier,
                      projectName: projectDetails?.name,
                    },
                    !projectDetails?.[feature.property as keyof IProject]
                      ? getEventType(feature.title, true)
                      : getEventType(feature.title, false)
                  );
                  handleSubmit({
                    [feature.property]: !projectDetails?.[feature.property as keyof IProject],
                  });
                }}
              >
                <span className="sr-only">Use {feature.title}</span>
                <span
                  aria-hidden="true"
                  className={`inline-block h-5 w-5 transform rounded-full bg-brand-surface-1 shadow ring-0 transition duration-200 ease-in-out ${
                    projectDetails?.[feature.property as keyof IProject]
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
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
