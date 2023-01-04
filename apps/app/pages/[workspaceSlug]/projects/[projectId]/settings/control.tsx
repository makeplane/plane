import React, { useEffect } from "react";

import { useRouter } from "next/router";
import type { NextPageContext, NextPage } from "next";

import useSWR, { mutate } from "swr";

import { Listbox, Transition } from "@headlessui/react";

import { Controller, useForm } from "react-hook-form";
// lib
import { requiredAdmin } from "lib/auth";
// layouts
import SettingsLayout from "layouts/settings-layout";
// services
import projectService from "lib/services/project.service";
import workspaceService from "lib/services/workspace.service";
// hooks
import useToast from "lib/hooks/useToast";
// ui
import { BreadcrumbItem, Breadcrumbs, Button } from "ui";
// icons
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
// types
import { IProject, IWorkspace } from "types";
// fetch-keys
import {
  PROJECTS_LIST,
  PROJECT_DETAILS,
  WORKSPACE_DETAILS,
  WORKSPACE_MEMBERS,
} from "constants/fetch-keys";

type TControlSettingsProps = {
  isMember: boolean;
  isOwner: boolean;
  isViewer: boolean;
  isGuest: boolean;
};

const ControlSettings: NextPage<TControlSettingsProps> = (props) => {
  const { isMember, isOwner, isViewer, isGuest } = props;

  const { setToastAlert } = useToast();

  const {
    query: { workspaceSlug, projectId },
  } = useRouter();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const { data: activeProject } = useSWR(
    activeWorkspace && projectId ? PROJECT_DETAILS(projectId as string) : null,
    activeWorkspace && projectId
      ? () => projectService.getProject(activeWorkspace.slug, projectId as string)
      : null
  );

  const { data: projectDetails } = useSWR<IProject>(
    activeWorkspace && activeProject ? PROJECT_DETAILS(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => projectService.getProject(activeWorkspace.slug, activeProject.id)
      : null
  );

  const { data: people } = useSWR(
    activeWorkspace ? WORKSPACE_MEMBERS : null,
    activeWorkspace ? () => workspaceService.workspaceMembers(activeWorkspace.slug) : null
  );

  const {
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<IProject>({});

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
    if (!activeWorkspace || !activeProject) return;
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
      .updateProject(activeWorkspace.slug, activeProject.id, payload)
      .then((res) => {
        mutate<IProject>(
          PROJECT_DETAILS(activeProject.id),
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

  return (
    <SettingsLayout
      type="project"
      memberType={{ isMember, isOwner, isViewer, isGuest }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${activeProject?.name ?? "Project"}`}
            link={`/projects/${activeProject?.id}/issues`}
          />
          <BreadcrumbItem title="Control Settings" />
        </Breadcrumbs>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-8">
          <div>
            <h3 className="text-3xl font-bold leading-6 text-gray-900">Control</h3>
            <p className="mt-4 text-sm text-gray-500">Set the control for the project.</p>
          </div>
          <div className="grid grid-cols-12 gap-16">
            <div className="col-span-5 space-y-16">
              <div>
                <h4 className="text-md mb-1 leading-6 text-gray-900">Project Lead</h4>
                <p className="mb-3 text-sm text-gray-500">Select the project leader.</p>
                <Controller
                  control={control}
                  name="project_lead"
                  render={({ field: { onChange, value } }) => (
                    <Listbox value={value} onChange={onChange}>
                      {({ open }) => (
                        <>
                          <div className="relative">
                            <Listbox.Button className="relative flex w-full cursor-default items-center justify-between gap-4 rounded-md border border-gray-300 p-3 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                              <span className="block truncate">
                                {people?.find((person) => person.member.id === value)?.member
                                  .first_name ?? "Select Lead"}
                              </span>
                              <ChevronDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                            </Listbox.Button>

                            <Transition
                              show={open}
                              as={React.Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {people?.map((person) => (
                                  <Listbox.Option
                                    key={person.id}
                                    className={({ active }) =>
                                      `${
                                        active ? "bg-indigo-50" : ""
                                      } relative cursor-default select-none px-3 py-2 text-gray-900`
                                    }
                                    value={person.member.id}
                                  >
                                    {({ selected, active }) => (
                                      <>
                                        <span
                                          className={`${
                                            selected ? "font-semibold" : "font-normal"
                                          } block truncate`}
                                        >
                                          {person.member.first_name !== ""
                                            ? person.member.first_name
                                            : person.member.email}
                                        </span>

                                        {selected ? (
                                          <span
                                            className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                              active ? "text-white" : "text-theme"
                                            }`}
                                          >
                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </Transition>
                          </div>
                        </>
                      )}
                    </Listbox>
                  )}
                />
              </div>
            </div>
            <div className="col-span-5 space-y-16">
              <div>
                <h4 className="text-md mb-1 leading-6 text-gray-900">Default Assignee</h4>
                <p className="mb-3 text-sm text-gray-500">
                  Select the default assignee for the project.
                </p>
                <Controller
                  control={control}
                  name="default_assignee"
                  render={({ field: { value, onChange } }) => (
                    <Listbox value={value} onChange={onChange}>
                      {({ open }) => (
                        <>
                          <div className="relative">
                            <Listbox.Button className="relative flex w-full cursor-default items-center justify-between gap-4 rounded-md border border-gray-300 p-3 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                              <span className="block truncate">
                                {people?.find((p) => p.member.id === value)?.member.first_name ??
                                  "Select Default Assignee"}
                              </span>
                              <ChevronDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                            </Listbox.Button>

                            <Transition
                              show={open}
                              as={React.Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {people?.map((person) => (
                                  <Listbox.Option
                                    key={person.id}
                                    className={({ active }) =>
                                      `${
                                        active ? "bg-indigo-50" : ""
                                      } relative cursor-default select-none px-3 py-2 text-gray-900`
                                    }
                                    value={person.member.id}
                                  >
                                    {({ selected, active }) => (
                                      <>
                                        <span
                                          className={`${
                                            selected ? "font-semibold" : "font-normal"
                                          } block truncate`}
                                        >
                                          {person.member.first_name !== ""
                                            ? person.member.first_name
                                            : person.member.email}
                                        </span>

                                        {selected ? (
                                          <span
                                            className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                              active ? "text-white" : "text-theme"
                                            }`}
                                          >
                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </Transition>
                          </div>
                        </>
                      )}
                    </Listbox>
                  )}
                />
              </div>
            </div>
          </div>
          <div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating Project..." : "Update Project"}
            </Button>
          </div>
        </div>
      </form>
    </SettingsLayout>
  );
};

export const getServerSideProps = async (ctx: NextPageContext) => {
  const projectId = ctx.query.projectId as string;

  const memberDetail = await requiredAdmin(projectId, ctx.req?.headers.cookie);

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
