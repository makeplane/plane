import React, { useEffect, useState } from "react";
// next
import type { NextPage } from "next";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
// swr
import useSWR, { mutate } from "swr";
// react hook form
import { useForm } from "react-hook-form";
// headless ui
import { Tab } from "@headlessui/react";
// hoc
import withAuth from "lib/hoc/withAuthWrapper";
// layouts
import SettingsLayout from "layouts/settings-layout";
import AppLayout from "layouts/app-layout";
// service
import projectServices from "lib/services/project.service";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// fetch keys
import { PROJECT_DETAILS, PROJECTS_LIST } from "constants/fetch-keys";
// ui
import { Spinner } from "ui";
import { Breadcrumbs, BreadcrumbItem } from "ui/Breadcrumbs";
// types
import type { IProject, IWorkspace } from "types";

const GeneralSettings = dynamic(() => import("components/project/settings/GeneralSettings"), {
  loading: () => <p>Loading...</p>,
  ssr: false,
});

const ControlSettings = dynamic(() => import("components/project/settings/ControlSettings"), {
  loading: () => <p>Loading...</p>,
  ssr: false,
});

const StatesSettings = dynamic(() => import("components/project/settings/StatesSettings"), {
  loading: () => <p>Loading...</p>,
  ssr: false,
});

const LabelsSettings = dynamic(() => import("components/project/settings/LabelsSettings"), {
  loading: () => <p>Loading...</p>,
  ssr: false,
});

const defaultValues: Partial<IProject> = {
  name: "",
  description: "",
  identifier: "",
  network: 0,
};

const ProjectSettings: NextPage = () => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<IProject>({
    defaultValues,
  });

  const router = useRouter();

  const { projectId } = router.query;

  const { activeWorkspace, activeProject } = useUser();

  const { setToastAlert } = useToast();

  const { data: projectDetails } = useSWR<IProject>(
    activeWorkspace && projectId ? PROJECT_DETAILS(projectId as string) : null,
    activeWorkspace
      ? () => projectServices.getProject(activeWorkspace.slug, projectId as string)
      : null
  );

  useEffect(() => {
    projectDetails &&
      reset({
        ...projectDetails,
        default_assignee: projectDetails.default_assignee?.id,
        project_lead: projectDetails.project_lead?.id,
        workspace: (projectDetails.workspace as IWorkspace).id,
      });
  }, [projectDetails, reset]);

  const onSubmit = async (formData: IProject) => {
    if (!activeWorkspace || !projectId) return;
    const payload: Partial<IProject> = {
      name: formData.name,
      network: formData.network,
      identifier: formData.identifier,
      description: formData.description,
      default_assignee: formData.default_assignee,
      project_lead: formData.project_lead,
    };
    await projectServices
      .updateProject(activeWorkspace.slug, projectId as string, payload)
      .then((res) => {
        mutate<IProject>(
          PROJECT_DETAILS(projectId as string),
          (prevData) => ({ ...prevData, ...res }),
          false
        );
        mutate<IProject[]>(
          PROJECTS_LIST(activeWorkspace.slug),
          (prevData) => {
            const newData = prevData?.map((item) => {
              if (item.id === res.id) {
                return res;
              }
              return item;
            });
            return newData;
          },
          false
        );
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Project updated successfully",
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const sidebarLinks: Array<{
    label: string;
    href: string;
  }> = [
    {
      label: "General",
      href: "#",
    },
    {
      label: "Control",
      href: "#",
    },
    {
      label: "States",
      href: "#",
    },
    {
      label: "Labels",
      href: "#",
    },
  ];

  return (
    <AppLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link="/projects" />
          <BreadcrumbItem title={`${activeProject?.name ?? "Project"} Settings`} />
        </Breadcrumbs>
      }
      // links={sidebarLinks}
    >
      {projectDetails ? (
        <div className="space-y-3">
          <Tab.Group>
            <Tab.List className="flex items-center gap-x-4 gap-y-2 flex-wrap mb-8">
              {["General", "Control", "States", "Labels"].map((tab, index) => (
                <Tab
                  key={index}
                  className={({ selected }) =>
                    `px-6 py-2 border-2 border-theme hover:bg-theme hover:text-white text-xs font-medium rounded-md outline-none duration-300 ${
                      selected ? "bg-theme text-white" : ""
                    }`
                  }
                >
                  {tab}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Tab.Panel>
                  <GeneralSettings
                    register={register}
                    errors={errors}
                    setError={setError}
                    isSubmitting={isSubmitting}
                  />
                </Tab.Panel>
                <Tab.Panel>
                  <ControlSettings control={control} isSubmitting={isSubmitting} />
                </Tab.Panel>
              </form>
              <Tab.Panel>
                <StatesSettings projectId={projectId} />
              </Tab.Panel>
              <Tab.Panel>
                <LabelsSettings />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      ) : (
        <div className="h-full w-full flex justify-center items-center">
          <Spinner />
        </div>
      )}
    </AppLayout>
  );
};

export default withAuth(ProjectSettings);
