import React, { useEffect } from "react";

import { useRouter } from "next/router";
import Image from "next/image";

import useSWR, { mutate } from "swr";

import { Controller, useForm } from "react-hook-form";
// lib
import { requiredAdmin } from "lib/auth";
// layouts
import AppLayout from "layouts/app-layout";
// services
import projectService from "services/project.service";
import workspaceService from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, CustomSelect, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import { IProject, IWorkspace } from "types";
import type { NextPage, GetServerSidePropsContext } from "next";
// fetch-keys
import { PROJECTS_LIST, PROJECT_DETAILS, WORKSPACE_MEMBERS } from "constants/fetch-keys";

type TControlSettingsProps = {
  isMember: boolean;
  isOwner: boolean;
  isViewer: boolean;
  isGuest: boolean;
};

const defaultValues: Partial<IProject> = {
  project_lead: null,
  default_assignee: null,
};

const ControlSettings: NextPage<TControlSettingsProps> = (props) => {
  const { isMember, isOwner, isViewer, isGuest } = props;

  const { setToastAlert } = useToast();

  const {
    query: { workspaceSlug, projectId },
  } = useRouter();

  const { data: projectDetails } = useSWR<IProject>(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: people } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug as string) : null
  );

  const {
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<IProject>({ defaultValues });

  useEffect(() => {
    if (projectDetails)
      reset({
        ...projectDetails,
        default_assignee: projectDetails.default_assignee?.id ?? projectDetails.default_assignee,
        project_lead: projectDetails.project_lead?.id ?? projectDetails.project_lead,
        workspace: (projectDetails.workspace as IWorkspace).id,
      });
  }, [projectDetails, reset]);

  const onSubmit = async (formData: IProject) => {
    if (!workspaceSlug || !projectId) return;
    const payload: Partial<IProject> = {
      name: formData.name,
      network: formData.network,
      identifier: formData.identifier,
      description: formData.description,
      default_assignee: formData.default_assignee,
      project_lead: formData.project_lead,
      icon: formData.icon,
    };
    await projectService
      .updateProject(workspaceSlug as string, projectId as string, payload)
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

  return (
    <AppLayout
      memberType={{ isMember, isOwner, isViewer, isGuest }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${projectDetails?.name ?? "Project"}`}
            link={`/${workspaceSlug}/projects/${projectId}/issues`}
          />
          <BreadcrumbItem title="Control Settings" />
        </Breadcrumbs>
      }
      settingsLayout
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-8 sm:space-y-12">
          <div className="grid grid-cols-12 items-start gap-4 sm:gap-16">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-xl font-semibold">Project Lead</h4>
              <p className="text-gray-500">Select the project leader.</p>
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
                          .first_name ?? "Select Lead"
                      }
                      width="w-full"
                      input
                    >
                      {people?.map((person) => (
                        <CustomSelect.Option
                          key={person.id}
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
              <h4 className="text-xl font-semibold">Default Assignee</h4>
              <p className="text-gray-500">Select the default assignee for the project.</p>
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
                        people?.find((p) => p.member.id === field.value)?.member.first_name ??
                        "Select Default Assignee"
                      }
                      width="w-full"
                      input
                    >
                      {people?.map((person) => (
                        <CustomSelect.Option
                          key={person.id}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating Project..." : "Update Project"}
            </Button>
          </div>
        </div>
      </form>
    </AppLayout>
  );
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const projectId = ctx.query.projectId as string;
  const workspaceSlug = ctx.query.workspaceSlug as string;

  const memberDetail = await requiredAdmin(workspaceSlug, projectId, ctx.req?.headers.cookie);

  return {
    props: {
      isOwner: memberDetail?.role === 20,
      isMember: memberDetail?.role === 15,
      isViewer: memberDetail?.role === 10,
      isGuest: memberDetail?.role === 5,
    },
  };
};

export default ControlSettings;
