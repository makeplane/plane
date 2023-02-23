import { useCallback, useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
import { IProject, IWorkspace, UserAuth } from "types";
// lib
import { requiredAdmin } from "lib/auth";
// layouts
import AppLayout from "layouts/app-layout";
// services
import projectService from "services/project.service";
import workspaceService from "services/workspace.service";
// components
import ConfirmProjectDeletion from "components/project/confirm-project-deletion";
import EmojiIconPicker from "components/emoji-icon-picker";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Input, TextArea, Loader, CustomSelect, OutlineButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// helpers
import { debounce } from "helpers/common.helper";
// types
import type { NextPage, GetServerSidePropsContext } from "next";
// fetch-keys
import { PROJECTS_LIST, PROJECT_DETAILS, WORKSPACE_DETAILS } from "constants/fetch-keys";
// constants
import { NETWORK_CHOICES } from "constants/project";

const defaultValues: Partial<IProject> = {
  name: "",
  description: "",
  identifier: "",
  network: 0,
};

const GeneralSettings: NextPage<UserAuth> = (props) => {
  const { isMember, isOwner, isViewer, isGuest } = props;

  const [selectProject, setSelectedProject] = useState<string | null>(null);

  const { setToastAlert } = useToast();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const { data: projectDetails } = useSWR<IProject>(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
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
    if (projectDetails)
      reset({
        ...projectDetails,
        default_assignee: projectDetails.default_assignee?.id,
        project_lead: projectDetails.project_lead?.id,
        workspace: (projectDetails.workspace as IWorkspace).id,
      });
  }, [projectDetails, reset]);

  const onSubmit = async (formData: IProject) => {
    if (!activeWorkspace || !projectDetails) return;

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
      .updateProject(activeWorkspace.slug, projectDetails.id, payload)
      .then((res) => {
        mutate<IProject>(
          PROJECT_DETAILS(projectDetails.id),
          (prevData) => ({ ...prevData, ...res }),
          false
        );
        mutate(PROJECTS_LIST(activeWorkspace.slug));
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
    <AppLayout
      settingsLayout="project"
      memberType={{ isMember, isOwner, isViewer, isGuest }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${projectDetails?.name ?? "Project"}`}
            link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
          />
          <BreadcrumbItem title="General Settings" />
        </Breadcrumbs>
      }
    >
      <ConfirmProjectDeletion
        data={projectDetails ?? null}
        isOpen={Boolean(selectProject)}
        onClose={() => setSelectedProject(null)}
        onSuccess={() => {
          router.push(`/${workspaceSlug}/projects`);
        }}
      />
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
                    render={({ field: { value, onChange } }) => (
                      <CustomSelect
                        value={value}
                        onChange={onChange}
                        label={
                          Object.keys(NETWORK_CHOICES).find((k) => k === value.toString())
                            ? NETWORK_CHOICES[value.toString() as keyof typeof NETWORK_CHOICES]
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
            {projectDetails ? (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating Project..." : "Update Project"}
              </Button>
            ) : (
              <Loader className="mt-2 w-full">
                <Loader.Item height="34px" width="100px" light />
              </Loader>
            )}
          </div>
          <div className="col-span-12">
            {projectDetails ? (
              <div>
                <h4 className="text-md mb-1 leading-6 text-gray-900">Danger Zone</h4>
                <p className="mb-3 text-sm text-gray-500">
                  The danger zone of the project delete page is a critical area that requires
                  careful consideration and attention. When deleting a project, all of the data and
                  resources within that project will be permanently removed and cannot be recovered.
                </p>
              </div>
            ) : (
              <Loader className="w-full space-y-2">
                <Loader.Item height="22px" width="250px" light />
                <Loader.Item height="46px" width="100%" light />
              </Loader>
            )}
            {projectDetails ? (
              <div>
                <OutlineButton
                  theme="danger"
                  onClick={() => setSelectedProject(projectDetails.id ?? null)}
                >
                  Delete Project
                </OutlineButton>
              </div>
            ) : (
              <Loader className="mt-2 w-full">
                <Loader.Item height="46px" width="100px" light />
              </Loader>
            )}
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

export default GeneralSettings;
