import { useCallback, useEffect } from "react";

import { useRouter } from "next/router";
import type { NextPage, NextPageContext } from "next";

import useSWR, { mutate } from "swr";

import { Controller, useForm } from "react-hook-form";
// fetch-keys
import { PROJECTS_LIST, PROJECT_DETAILS, WORKSPACE_DETAILS } from "constants/fetch-keys";
// common
import { debounce } from "constants/common";
// constants
import { NETWORK_CHOICES } from "constants/";
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
import {
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  EmojiIconPicker,
  Input,
  Select,
  TextArea,
  Loader,
  CustomSelect,
} from "ui";
// types
import { IProject, IWorkspace } from "types";

const defaultValues: Partial<IProject> = {
  name: "",
  description: "",
  identifier: "",
  network: 0,
};

type TGeneralSettingsProps = {
  isMember: boolean;
  isOwner: boolean;
  isViewer: boolean;
  isGuest: boolean;
};

const GeneralSettings: NextPage<TGeneralSettingsProps> = (props) => {
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

  const checkIdentifier = (slug: string, value: string) => {
    projectService.checkProjectIdentifierAvailability(slug, value).then((response) => {
      if (response.exists) setError("identifier", { message: "Identifier already exists" });
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkIdentifierAvailability = useCallback(debounce(checkIdentifier, 1500), []);

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
        console.error(err);
      });
  };

  return (
    <SettingsLayout
      memberType={{ isMember, isOwner, isViewer, isGuest }}
      type="project"
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${activeProject?.name ?? "Project"}`}
            link={`/${workspaceSlug}/projects/${activeProject?.id}/issues`}
          />
          <BreadcrumbItem title="General Settings" />
        </Breadcrumbs>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-8">
          <div>
            <h3 className="text-3xl font-bold leading-6 text-gray-900">General</h3>
            <p className="mt-4 text-sm text-gray-500">
              This information will be displayed to every member of the project.
            </p>
          </div>
          <div className="grid grid-cols-12 gap-16">
            <div className="col-span-5 space-y-16">
              <div>
                <h4 className="text-md mb-1 leading-6 text-gray-900">Icon & Name</h4>
                <p className="mb-3 text-sm text-gray-500">
                  Select an icon and a name for the project.
                </p>
                <div className="flex gap-2">
                  {projectDetails ? (
                    <Controller
                      control={control}
                      name="icon"
                      render={({ field: { value, onChange } }) => (
                        <EmojiIconPicker
                          label={value ? String.fromCodePoint(parseInt(value)) : "Icon"}
                          value={value}
                          onChange={onChange}
                        />
                      )}
                    />
                  ) : (
                    <Loader>
                      <Loader.Item height="46px" width="46px" light />
                    </Loader>
                  )}
                  {projectDetails ? (
                    <Input
                      id="name"
                      name="name"
                      error={errors.name}
                      register={register}
                      placeholder="Project Name"
                      className="w-auto"
                      validations={{
                        required: "Name is required",
                      }}
                    />
                  ) : (
                    <Loader>
                      <Loader.Item height="46px" width="225px" light />
                    </Loader>
                  )}
                </div>
              </div>
            </div>
            <div className="col-span-5 space-y-16">
              <div>
                <h4 className="text-md mb-1 leading-6 text-gray-900">Description</h4>
                <p className="mb-3 text-sm text-gray-500">Give a description to the project.</p>
                {projectDetails ? (
                  <TextArea
                    id="description"
                    name="description"
                    error={errors.description}
                    register={register}
                    placeholder="Enter project description"
                    validations={{}}
                    className="min-h-[46px]"
                  />
                ) : (
                  <Loader className="w-full">
                    <Loader.Item height="46px" width="full" light />
                  </Loader>
                )}
              </div>
            </div>
            <div className="col-span-5 space-y-16">
              <div>
                <h4 className="text-md mb-1 leading-6 text-gray-900">Identifier</h4>
                <p className="mb-3 text-sm text-gray-500">
                  Create a 1-6 characters{"'"} identifier for the project.
                </p>
                {projectDetails ? (
                  <Input
                    id="identifier"
                    name="identifier"
                    error={errors.identifier}
                    register={register}
                    placeholder="Enter identifier"
                    className="w-40"
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
                ) : (
                  <Loader>
                    <Loader.Item height="46px" width="160px" light />
                  </Loader>
                )}
              </div>
            </div>
            <div className="col-span-5 space-y-16">
              <div>
                <h4 className="text-md mb-1 leading-6 text-gray-900">Network</h4>
                <p className="mb-3 text-sm text-gray-500">Select privacy type for the project.</p>
                {projectDetails ? (
                  <Controller
                    name="network"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        {...field}
                        label={
                          Object.keys(NETWORK_CHOICES).find((k) => k === field.value.toString())
                            ? NETWORK_CHOICES[
                                field.value.toString() as keyof typeof NETWORK_CHOICES
                              ]
                            : "Select network"
                        }
                        input
                      >
                        {Object.keys(NETWORK_CHOICES).map((key) => (
                          <CustomSelect.Option key={key} value={key}>
                            {NETWORK_CHOICES[key as keyof typeof NETWORK_CHOICES]}
                          </CustomSelect.Option>
                        ))}
                      </CustomSelect>
                    )}
                  />
                ) : (
                  <Loader className="w-full">
                    <Loader.Item height="46px" width="160px" light />
                  </Loader>
                )}
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

export default GeneralSettings;
