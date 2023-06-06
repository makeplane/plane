import React, { useEffect } from "react";

import { useRouter } from "next/router";
import Image from "next/image";

import useSWR, { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// services
import projectService from "services/project.service";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// components
import { SettingsHeader } from "components/project";
// ui
import { CustomSelect, Loader, SecondaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import { IProject, IWorkspace } from "types";
import type { NextPage } from "next";
// fetch-keys
import { PROJECTS_LIST, PROJECT_DETAILS, PROJECT_MEMBERS } from "constants/fetch-keys";

const defaultValues: Partial<IProject> = {
  project_lead: null,
  default_assignee: null,
};

const ControlSettings: NextPage = () => {
  const { setToastAlert } = useToast();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUserAuth();

  const { data: projectDetails } = useSWR<IProject>(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: people } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const {
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<IProject>({ defaultValues });

  const onSubmit = async (formData: IProject) => {
    if (!workspaceSlug || !projectId) return;

    const payload: Partial<IProject> = {
      default_assignee: formData.default_assignee,
      project_lead: formData.project_lead,
    };

    await projectService
      .updateProject(workspaceSlug as string, projectId as string, payload, user)
      .then((res) => {
        mutate(PROJECT_DETAILS(projectId as string));
        mutate(PROJECTS_LIST(workspaceSlug as string));

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

  useEffect(() => {
    if (projectDetails)
      reset({
        ...projectDetails,
        default_assignee: projectDetails.default_assignee?.id ?? projectDetails.default_assignee,
        project_lead: projectDetails.project_lead?.id ?? projectDetails.project_lead,
        workspace: (projectDetails.workspace as IWorkspace).id,
      });
  }, [projectDetails, reset]);

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${projectDetails?.name ?? "Project"}`}
            link={`/${workspaceSlug}/projects/${projectId}/issues`}
          />
          <BreadcrumbItem title="Control Settings" />
        </Breadcrumbs>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-8">
        <SettingsHeader />
        <div className="space-y-8 sm:space-y-12">
          <div className="grid grid-cols-12 items-start gap-4 sm:gap-16">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-lg font-semibold">Project Lead</h4>
              <p className="text-sm text-brand-secondary">Select the project leader.</p>
            </div>
            <div className="col-span-12 sm:col-span-6">
              {projectDetails ? (
                <Controller
                  name="project_lead"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      {...field}
                      label={
                        people?.find((person) => person.member.id === field.value)?.member
                          .first_name ?? <span className="text-brand-secondary">Select lead</span>
                      }
                      width="w-full"
                      input
                    >
                      {people?.map((person) => (
                        <CustomSelect.Option
                          key={person.member.id}
                          value={person.member.id}
                          className="flex items-center gap-2"
                        >
                          <div className="flex items-center gap-2">
                            {person.member.avatar && person.member.avatar !== "" ? (
                              <div className="relative h-4 w-4">
                                <Image
                                  src={person.member.avatar}
                                  alt="avatar"
                                  className="rounded-full"
                                  layout="fill"
                                  objectFit="cover"
                                />
                              </div>
                            ) : (
                              <div className="grid h-4 w-4 flex-shrink-0 place-items-center rounded-full bg-gray-700 capitalize text-white">
                                {person.member.first_name && person.member.first_name !== ""
                                  ? person.member.first_name.charAt(0)
                                  : person.member.email.charAt(0)}
                              </div>
                            )}
                            {person.member.first_name !== ""
                              ? person.member.first_name
                              : person.member.email}
                          </div>
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  )}
                />
              ) : (
                <Loader className="h-9 w-full">
                  <Loader.Item width="100%" height="100%" />
                </Loader>
              )}
            </div>
          </div>
          <div className="grid grid-cols-12 items-start gap-4 sm:gap-16">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-lg font-semibold">Default Assignee</h4>
              <p className="text-sm text-brand-secondary">
                Select the default assignee for the project.
              </p>
            </div>
            <div className="col-span-12 sm:col-span-6">
              {projectDetails ? (
                <Controller
                  name="default_assignee"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      {...field}
                      label={
                        people?.find((p) => p.member.id === field.value)?.member.first_name ?? (
                          <span className="text-brand-secondary">Select default assignee</span>
                        )
                      }
                      width="w-full"
                      input
                    >
                      {people?.map((person) => (
                        <CustomSelect.Option
                          key={person.member.id}
                          value={person.member.id}
                          className="flex items-center gap-2"
                        >
                          <div className="flex items-center gap-2">
                            {person.member.avatar && person.member.avatar !== "" ? (
                              <div className="relative h-4 w-4">
                                <Image
                                  src={person.member.avatar}
                                  alt="avatar"
                                  className="rounded-full"
                                  layout="fill"
                                  objectFit="cover"
                                />
                              </div>
                            ) : (
                              <div className="grid h-4 w-4 flex-shrink-0 place-items-center rounded-full bg-gray-700 capitalize text-white">
                                {person.member.first_name && person.member.first_name !== ""
                                  ? person.member.first_name.charAt(0)
                                  : person.member.email.charAt(0)}
                              </div>
                            )}
                            {person.member.first_name !== ""
                              ? person.member.first_name
                              : person.member.email}
                          </div>
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  )}
                />
              ) : (
                <Loader className="h-9 w-full">
                  <Loader.Item width="100%" height="100%" />
                </Loader>
              )}
            </div>
          </div>
          <div className="sm:text-right">
            <SecondaryButton type="submit" loading={isSubmitting}>
              {isSubmitting ? "Updating Project..." : "Update Project"}
            </SecondaryButton>
          </div>
        </div>
      </form>
    </ProjectAuthorizationWrapper>
  );
};

export default ControlSettings;
