import { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// services
import projectService from "services/project.service";
// components
import { DeleteProjectModal, SettingsHeader } from "components/project";
import { ImagePickerPopover } from "components/core";
import EmojiIconPicker from "components/emoji-icon-picker";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// ui
import {
  Input,
  TextArea,
  Loader,
  CustomSelect,
  SecondaryButton,
  DangerButton,
} from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
import { truncateText } from "helpers/string.helper";
// types
import { IProject, IWorkspace } from "types";
import type { NextPage } from "next";
// fetch-keys
import { PROJECTS_LIST, PROJECT_DETAILS, USER_PROJECT_VIEW } from "constants/fetch-keys";
// constants
import { NETWORK_CHOICES } from "constants/project";

const defaultValues: Partial<IProject> = {
  name: "",
  description: "",
  identifier: "",
  network: 0,
};

const GeneralSettings: NextPage = () => {
  const [selectProject, setSelectedProject] = useState<string | null>(null);

  const { user } = useUserAuth();

  const { setToastAlert } = useToast();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: projectDetails } = useSWR<IProject>(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: memberDetails, error } = useSWR(
    workspaceSlug && projectId ? USER_PROJECT_VIEW(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMemberMe(workspaceSlug.toString(), projectId.toString())
      : null
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<IProject>({
    defaultValues,
  });

  useEffect(() => {
    if (projectDetails)
      reset({
        ...projectDetails,
        emoji_and_icon: projectDetails.emoji ?? projectDetails.icon_prop,
        workspace: (projectDetails.workspace as IWorkspace).id,
      });
  }, [projectDetails, reset]);

  const updateProject = async (payload: Partial<IProject>) => {
    if (!workspaceSlug || !projectDetails) return;

    await projectService
      .updateProject(workspaceSlug as string, projectDetails.id, payload, user)
      .then((res) => {
        mutate<IProject>(
          PROJECT_DETAILS(projectDetails.id),
          (prevData) => ({ ...prevData, ...res }),
          false
        );

        mutate(
          PROJECTS_LIST(workspaceSlug as string, {
            is_favorite: "all",
          })
        );

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Project updated successfully",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Project could not be updated. Please try again.",
        });
      });
  };

  const onSubmit = async (formData: IProject) => {
    if (!workspaceSlug || !projectDetails) return;

    const payload: Partial<IProject> = {
      name: formData.name,
      network: formData.network,
      identifier: formData.identifier,
      description: formData.description,
      cover_image: formData.cover_image,
    };

    if (typeof formData.emoji_and_icon === "object") {
      payload.emoji = null;
      payload.icon_prop = formData.emoji_and_icon;
    } else {
      payload.emoji = formData.emoji_and_icon;
      payload.icon_prop = null;
    }

    if (projectDetails.identifier !== formData.identifier)
      await projectService
        .checkProjectIdentifierAvailability(workspaceSlug as string, payload.identifier ?? "")
        .then(async (res) => {
          if (res.exists) setError("identifier", { message: "Identifier already exists" });
          else await updateProject(payload);
        });
    else await updateProject(payload);
  };

  const handleIdentifierChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    const alphanumericValue = value.replace(/[^a-zA-Z0-9]/g, "");
    const formattedValue = alphanumericValue.toUpperCase();

    setValue("identifier", formattedValue);
  };

  const currentNetwork = NETWORK_CHOICES.find((n) => n.key === projectDetails?.network);

  const isAdmin = memberDetails?.role === 20;

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(projectDetails?.name ?? "Project", 32)}`}
            link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
            linkTruncate
          />
          <BreadcrumbItem title="General Settings" unshrinkTitle />
        </Breadcrumbs>
      }
    >
      <DeleteProjectModal
        data={projectDetails ?? null}
        isOpen={Boolean(selectProject)}
        onClose={() => setSelectedProject(null)}
        onSuccess={() => {
          router.push(`/${workspaceSlug}/projects`);
        }}
        user={user}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="p-8">
        <SettingsHeader />
        <div className="space-y-8 sm:space-y-12">
          <div className="grid grid-cols-12 items-start gap-4 sm:gap-16">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-lg font-semibold">Icon & Name</h4>
              <p className="text-sm text-custom-text-200">
                Select an icon and a name for your project.
              </p>
            </div>
            <div className="col-span-12 flex gap-2 sm:col-span-6">
              {projectDetails ? (
                <div className="h-7 w-7 grid place-items-center">
                  <Controller
                    control={control}
                    name="emoji_and_icon"
                    render={({ field: { value, onChange } }) => (
                      <EmojiIconPicker
                        label={value ? renderEmoji(value) : "Icon"}
                        value={value}
                        onChange={onChange}
                      />
                    )}
                  />
                </div>
              ) : (
                <Loader>
                  <Loader.Item height="46px" width="46px" />
                </Loader>
              )}
              {projectDetails ? (
                <Input
                  id="name"
                  name="name"
                  error={errors.name}
                  register={register}
                  placeholder="Project Name"
                  validations={{
                    required: "Name is required",
                  }}
                />
              ) : (
                <Loader>
                  <Loader.Item height="46px" width="225px" />
                </Loader>
              )}
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 sm:gap-16">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-lg font-semibold">Description</h4>
              <p className="text-sm text-custom-text-200">Give a description to your project.</p>
            </div>
            <div className="col-span-12 sm:col-span-6">
              {projectDetails ? (
                <TextArea
                  id="description"
                  name="description"
                  error={errors.description}
                  register={register}
                  placeholder="Enter project description"
                  validations={{}}
                  className="min-h-[46px] text-sm"
                />
              ) : (
                <Loader className="w-full">
                  <Loader.Item height="46px" width="full" />
                </Loader>
              )}
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 sm:gap-16">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-lg font-semibold">Cover Photo</h4>
              <p className="text-sm text-custom-text-200">
                Select your cover photo from the given library.
              </p>
            </div>
            <div className="col-span-12 sm:col-span-6">
              {watch("cover_image") ? (
                <div className="h-32 w-full rounded border border-custom-border-200 p-1">
                  <div className="relative h-full w-full rounded">
                    <img
                      src={watch("cover_image")!}
                      className="absolute top-0 left-0 h-full w-full object-cover rounded"
                      alt={projectDetails?.name ?? "Cover image"}
                    />
                    <div className="absolute bottom-0 flex w-full justify-end">
                      <ImagePickerPopover
                        label={"Change cover"}
                        onChange={(imageUrl) => {
                          setValue("cover_image", imageUrl);
                        }}
                        value={watch("cover_image")}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <Loader className="w-full">
                  <Loader.Item height="46px" width="full" />
                </Loader>
              )}
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 sm:gap-16">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-lg font-semibold">Identifier</h4>
              <p className="text-sm text-custom-text-200">
                Create a 1-6 characters{"'"} identifier for the project.
              </p>
            </div>
            <div className="col-span-12 sm:col-span-6">
              {projectDetails ? (
                <Input
                  id="identifier"
                  name="identifier"
                  error={errors.identifier}
                  register={register}
                  placeholder="Enter identifier"
                  onChange={handleIdentifierChange}
                  validations={{
                    required: "Identifier is required",
                    validate: (value) =>
                      /^[A-Z0-9]+$/.test(value.toUpperCase()) || "Identifier must be in uppercase.",
                    minLength: {
                      value: 1,
                      message: "Identifier must at least be of 1 character",
                    },
                    maxLength: {
                      value: 5,
                      message: "Identifier must at most be of 5 characters",
                    },
                  }}
                />
              ) : (
                <Loader>
                  <Loader.Item height="46px" width="160px" />
                </Loader>
              )}
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 sm:gap-16">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-lg font-semibold">Network</h4>
              <p className="text-sm text-custom-text-200">Select privacy type for the project.</p>
            </div>
            <div className="col-span-12 sm:col-span-6">
              {projectDetails ? (
                <Controller
                  name="network"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <CustomSelect
                      value={value}
                      onChange={onChange}
                      label={currentNetwork?.label ?? "Select network"}
                      input
                    >
                      {NETWORK_CHOICES.map((network) => (
                        <CustomSelect.Option key={network.key} value={network.key}>
                          {network.label}
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  )}
                />
              ) : (
                <Loader className="w-full">
                  <Loader.Item height="46px" width="160px" />
                </Loader>
              )}
            </div>
          </div>
          <div className="sm:text-right">
            {projectDetails ? (
              <SecondaryButton type="submit" loading={isSubmitting} disabled={!isAdmin}>
                {isSubmitting ? "Updating Project..." : "Update Project"}
              </SecondaryButton>
            ) : (
              <Loader className="mt-2 w-full">
                <Loader.Item height="34px" width="100px" />
              </Loader>
            )}
          </div>
          {memberDetails?.role === 20 && (
            <div className="grid grid-cols-12 gap-4 sm:gap-16">
              <div className="col-span-12 sm:col-span-6">
                <h4 className="text-lg font-semibold">Danger Zone</h4>
                <p className="text-sm text-custom-text-200">
                  The danger zone of the project delete page is a critical area that requires
                  careful consideration and attention. When deleting a project, all of the data and
                  resources within that project will be permanently removed and cannot be recovered.
                </p>
              </div>
              <div className="col-span-12 sm:col-span-6">
                {projectDetails ? (
                  <div>
                    <DangerButton
                      onClick={() => setSelectedProject(projectDetails.id ?? null)}
                      outline
                    >
                      Delete Project
                    </DangerButton>
                  </div>
                ) : (
                  <Loader className="mt-2 w-full">
                    <Loader.Item height="46px" width="100px" />
                  </Loader>
                )}
              </div>
            </div>
          )}
        </div>
      </form>
    </ProjectAuthorizationWrapper>
  );
};

export default GeneralSettings;
