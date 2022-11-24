import React, { useEffect, useCallback, useState } from "react";
// swr
import { mutate } from "swr";
// next
import type { NextPage } from "next";
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// react hook form
import { useForm, Controller } from "react-hook-form";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// layouts
import ProjectLayout from "layouts/ProjectLayout";
// service
import projectServices from "lib/services/project.service";
import workspaceService from "lib/services/workspace.service";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// fetch keys
import { PROJECT_DETAILS, PROJECTS_LIST, WORKSPACE_MEMBERS } from "constants/fetch-keys";
// commons
import { addSpaceIfCamelCase, debounce } from "constants/common";
// components
import CreateUpdateStateModal from "components/project/issues/BoardView/state/CreateUpdateStateModal";
// ui
import { Spinner, Button, Input, TextArea, Select } from "ui";
import { Breadcrumbs, BreadcrumbItem } from "ui/Breadcrumbs";
// icons
import {
  ChevronDownIcon,
  CheckIcon,
  PlusIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
// types
import type { IProject, IState, IWorkspace, WorkspaceMember } from "types";

const defaultValues: Partial<IProject> = {
  name: "",
  description: "",
};

const NETWORK_CHOICES = { "0": "Secret", "2": "Public" };

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

  const [isCreateStateModalOpen, setIsCreateStateModalOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<string | undefined>();

  const router = useRouter();

  const { projectId } = router.query;

  const { activeWorkspace, activeProject, states } = useUser();

  const { setToastAlert } = useToast();

  const { data: projectDetails } = useSWR<IProject>(
    activeWorkspace && projectId ? PROJECT_DETAILS : null,
    activeWorkspace
      ? () => projectServices.getProject(activeWorkspace.slug, projectId as string)
      : null
  );

  const { data: people } = useSWR<WorkspaceMember[]>(
    activeWorkspace ? WORKSPACE_MEMBERS : null,
    activeWorkspace ? () => workspaceService.workspaceMembers(activeWorkspace.slug) : null
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
    if (!activeWorkspace) return;
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
        mutate<IProject>(PROJECT_DETAILS, (prevData) => ({ ...prevData, ...res }), false);
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

  const checkIdentifier = (slug: string, value: string) => {
    projectServices.checkProjectIdentifierAvailability(slug, value).then((response) => {
      console.log(response);
      if (response.exists) setError("identifier", { message: "Identifier already exists" });
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkIdentifierAvailability = useCallback(debounce(checkIdentifier, 1500), []);

  return (
    <ProjectLayout>
      <div className="w-full h-full space-y-5">
        <CreateUpdateStateModal
          isOpen={isCreateStateModalOpen || Boolean(selectedState)}
          handleClose={() => {
            setSelectedState(undefined);
            setIsCreateStateModalOpen(false);
          }}
          projectId={projectId as string}
          data={selectedState ? states?.find((state) => state.id === selectedState) : undefined}
        />
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link="/projects" />
          <BreadcrumbItem title={`${activeProject?.name} Settings`} />
        </Breadcrumbs>
        <div className="w-full h-full flex flex-col space-y-3">
          {projectDetails ? (
            <div>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-3">
                <div className="space-y-8">
                  <section className="space-y-5">
                    <div>
                      <h3 className="text-lg font-medium leading-6 text-gray-900">General</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        This information will be displayed to every member of the project.
                      </p>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-2">
                        <Input
                          id="name"
                          name="name"
                          error={errors.name}
                          register={register}
                          placeholder="Project Name"
                          label="Name"
                          validations={{
                            required: "Name is required",
                          }}
                        />
                      </div>
                      <div>
                        <Select
                          name="network"
                          id="network"
                          options={Object.keys(NETWORK_CHOICES).map((key) => ({
                            value: key,
                            label: NETWORK_CHOICES[key as keyof typeof NETWORK_CHOICES],
                          }))}
                          label="Network"
                          register={register}
                          validations={{
                            required: "Network is required",
                          }}
                        />
                      </div>
                      <div>
                        <Input
                          id="identifier"
                          name="identifier"
                          error={errors.identifier}
                          register={register}
                          placeholder="Enter identifier"
                          label="Identifier"
                          onChange={(e: any) => {
                            if (!activeWorkspace || !e.target.value) return;
                            checkIdentifierAvailability(activeWorkspace.slug, e.target.value);
                          }}
                          validations={{
                            required: "Identifier is required",
                            minLength: {
                              value: 1,
                              message: "Identifier must at least be of 1 character",
                            },
                            maxLength: {
                              value: 9,
                              message: "Identifier must at most be of 9 characters",
                            },
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <TextArea
                        id="description"
                        name="description"
                        error={errors.description}
                        register={register}
                        label="Description"
                        placeholder="Enter project description"
                        validations={{
                          required: "Description is required",
                        }}
                      />
                    </div>
                  </section>
                  <section className="space-y-5">
                    <div>
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Control</h3>
                      <p className="mt-1 text-sm text-gray-500">Set the control for the project.</p>
                    </div>
                    <div className="flex justify-between gap-3">
                      <div className="w-full md:w-1/2">
                        <Controller
                          control={control}
                          name="project_lead"
                          render={({ field: { onChange, value } }) => (
                            <Listbox value={value} onChange={onChange}>
                              {({ open }) => (
                                <>
                                  <Listbox.Label>
                                    <div className="text-gray-500 mb-2">Project Lead</div>
                                  </Listbox.Label>
                                  <div className="relative">
                                    <Listbox.Button className="bg-white relative w-full border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                      <span className="block truncate">
                                        {people?.find((person) => person.member.id === value)
                                          ?.member.first_name ?? "Select Lead"}
                                      </span>
                                      <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                        <ChevronDownIcon
                                          className="h-5 w-5 text-gray-400"
                                          aria-hidden="true"
                                        />
                                      </span>
                                    </Listbox.Button>

                                    <Transition
                                      show={open}
                                      as={React.Fragment}
                                      leave="transition ease-in duration-100"
                                      leaveFrom="opacity-100"
                                      leaveTo="opacity-0"
                                    >
                                      <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                        {people?.map((person) => (
                                          <Listbox.Option
                                            key={person.id}
                                            className={({ active }) =>
                                              `${
                                                active ? "text-white bg-theme" : "text-gray-900"
                                              } cursor-default select-none relative py-2 pl-3 pr-9`
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
                                                  {person.member.first_name}
                                                </span>

                                                {selected ? (
                                                  <span
                                                    className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                                      active ? "text-white" : "text-indigo-600"
                                                    }`}
                                                  >
                                                    <CheckIcon
                                                      className="h-5 w-5"
                                                      aria-hidden="true"
                                                    />
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
                      <div className="w-full md:w-1/2">
                        <Controller
                          control={control}
                          name="default_assignee"
                          render={({ field: { value, onChange } }) => (
                            <Listbox value={value} onChange={onChange}>
                              {({ open }) => (
                                <>
                                  <Listbox.Label>
                                    <div className="text-gray-500 mb-2">Default Assignee</div>
                                  </Listbox.Label>
                                  <div className="relative">
                                    <Listbox.Button className="bg-white relative w-full border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                      <span className="block truncate">
                                        {people?.find((p) => p.member.id === value)?.member
                                          .first_name ?? "Select Default Assignee"}
                                      </span>
                                      <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                        <ChevronDownIcon
                                          className="h-5 w-5 text-gray-400"
                                          aria-hidden="true"
                                        />
                                      </span>
                                    </Listbox.Button>

                                    <Transition
                                      show={open}
                                      as={React.Fragment}
                                      leave="transition ease-in duration-100"
                                      leaveFrom="opacity-100"
                                      leaveTo="opacity-0"
                                    >
                                      <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                        {people?.map((person) => (
                                          <Listbox.Option
                                            key={person.id}
                                            className={({ active }) =>
                                              `${
                                                active ? "text-white bg-theme" : "text-gray-900"
                                              } cursor-default select-none relative py-2 pl-3 pr-9`
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
                                                  {person.member.first_name}
                                                </span>

                                                {selected ? (
                                                  <span
                                                    className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                                      active ? "text-white" : "text-indigo-600"
                                                    }`}
                                                  >
                                                    <CheckIcon
                                                      className="h-5 w-5"
                                                      aria-hidden="true"
                                                    />
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
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Updating Project..." : "Update Project"}
                      </Button>
                    </div>
                  </section>
                  <section className="space-y-5">
                    <div>
                      <h3 className="text-lg font-medium leading-6 text-gray-900">State</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Manage the state of this project.
                      </p>
                    </div>
                    <div className="flex justify-between gap-3">
                      <div className="w-full space-y-5">
                        {states?.map((state) => (
                          <div
                            className="border p-1 px-4 rounded flex justify-between items-center"
                            key={state.id}
                          >
                            <div className="flex items-center gap-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: state.color,
                                }}
                              ></div>
                              <h4>{addSpaceIfCamelCase(state.name)}</h4>
                            </div>
                            <div>
                              <button type="button" onClick={() => setSelectedState(state.id)}>
                                <PencilSquareIcon className="h-5 w-5 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="flex items-center gap-x-1"
                          onClick={() => setIsCreateStateModalOpen(true)}
                        >
                          <PlusIcon className="h-4 w-4 text-gray-400" />
                          <span>Add State</span>
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              </form>
            </div>
          ) : (
            <div className="w-full h-full flex justify-center items-center">
              <Spinner />
            </div>
          )}
        </div>
      </div>
    </ProjectLayout>
  );
};

export default ProjectSettings;
