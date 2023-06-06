import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// services
import workspaceService from "services/workspace.service";
import fileService from "services/file.service";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
import SettingsNavbar from "layouts/settings-navbar";
// components
import { ImageUploadModal } from "components/core";
import { DeleteWorkspaceModal, SettingsHeader } from "components/workspace";
// ui
import { Spinner, Input, CustomSelect, SecondaryButton, DangerButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { LinkIcon } from "@heroicons/react/24/outline";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import type { IWorkspace } from "types";
import type { NextPage } from "next";
// fetch-keys
import { WORKSPACE_DETAILS, USER_WORKSPACES } from "constants/fetch-keys";
// constants
import { COMPANY_SIZE } from "constants/workspace";

const defaultValues: Partial<IWorkspace> = {
  name: "",
  url: "",
  company_size: null,
  logo: null,
};

const WorkspaceSettings: NextPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isImageRemoving, setIsImageRemoving] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUserAuth();

  const { setToastAlert } = useToast();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IWorkspace>({
    defaultValues: { ...defaultValues, ...activeWorkspace },
  });

  useEffect(() => {
    if (activeWorkspace) reset({ ...activeWorkspace });
  }, [activeWorkspace, reset]);

  const onSubmit = async (formData: IWorkspace) => {
    if (!activeWorkspace) return;

    const payload: Partial<IWorkspace> = {
      logo: formData.logo,
      name: formData.name,
      company_size: formData.company_size,
    };

    await workspaceService
      .updateWorkspace(activeWorkspace.slug, payload, user)
      .then((res) => {
        mutate<IWorkspace[]>(USER_WORKSPACES, (prevData) =>
          prevData?.map((workspace) => (workspace.id === res.id ? res : workspace))
        );
        mutate<IWorkspace>(WORKSPACE_DETAILS(workspaceSlug as string), (prevData) => {
          if (!prevData) return prevData;

          return {
            ...prevData,
            logo: formData.logo,
          };
        });
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Workspace updated successfully",
        });
      })
      .catch((err) => console.error(err));
  };

  const handleDelete = (url: string | null | undefined) => {
    if (!activeWorkspace || !url) return;

    setIsImageRemoving(true);

    const index = url.indexOf(".com");
    const asset = url.substring(index + 5);

    fileService.deleteFile(asset).then(() => {
      workspaceService
        .updateWorkspace(activeWorkspace.slug, { logo: "" }, user)
        .then((res) => {
          setToastAlert({
            type: "success",
            title: "Success!",
            message: "Workspace picture removed successfully.",
          });
          mutate<IWorkspace[]>(USER_WORKSPACES, (prevData) =>
            prevData?.map((workspace) => (workspace.id === res.id ? res : workspace))
          );
          mutate<IWorkspace>(WORKSPACE_DETAILS(workspaceSlug as string), (prevData) => {
            if (!prevData) return prevData;

            return {
              ...prevData,
              logo: "",
            };
          });
        })
        .catch(() => {
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "There was some error in deleting your profile picture. Please try again.",
          });
        })
        .finally(() => setIsImageRemoving(false));
    });
  };

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title={`${activeWorkspace?.name ?? "Workspace"} Settings`} />
        </Breadcrumbs>
      }
    >
      <ImageUploadModal
        isOpen={isImageUploadModalOpen}
        onClose={() => setIsImageUploadModalOpen(false)}
        onSuccess={(imageUrl) => {
          setIsImageUploading(true);
          setValue("logo", imageUrl);
          setIsImageUploadModalOpen(false);
          handleSubmit(onSubmit)().then(() => setIsImageUploading(false));
        }}
        value={watch("logo")}
      />
      <DeleteWorkspaceModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        data={activeWorkspace ?? null}
        user={user}
      />
      <div className="p-8">
        <SettingsHeader />
        {activeWorkspace ? (
          <div className="space-y-8 sm:space-y-12">
            <div className="grid grid-cols-12 gap-4 sm:gap-16">
              <div className="col-span-12 sm:col-span-6">
                <h4 className="text-lg font-semibold">Logo</h4>
                <p className="text-sm text-brand-secondary">
                  Max file size is 5MB. Supported file types are .jpg and .png.
                </p>
              </div>
              <div className="col-span-12 sm:col-span-6">
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setIsImageUploadModalOpen(true)}>
                    {watch("logo") && watch("logo") !== null && watch("logo") !== "" ? (
                      <div className="relative mx-auto flex h-12 w-12">
                        <img
                          src={watch("logo")!}
                          alt="Workspace Logo"
                          className="absolute top-0 left-0 h-full w-full object-cover rounded-md"
                        />
                      </div>
                    ) : (
                      <div className="relative flex h-12 w-12 items-center justify-center rounded bg-gray-700 p-4 uppercase text-white">
                        {activeWorkspace?.name?.charAt(0) ?? "N"}
                      </div>
                    )}
                  </button>
                  <div className="flex gap-4">
                    <SecondaryButton
                      onClick={() => {
                        setIsImageUploadModalOpen(true);
                      }}
                    >
                      {isImageUploading ? "Uploading..." : "Upload"}
                    </SecondaryButton>
                    {activeWorkspace.logo && activeWorkspace.logo !== "" && (
                      <DangerButton onClick={() => handleDelete(activeWorkspace.logo)}>
                        {isImageRemoving ? "Removing..." : "Remove"}
                      </DangerButton>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4 sm:gap-16">
              <div className="col-span-12 sm:col-span-6">
                <h4 className="text-lg font-semibold">URL</h4>
                <p className="text-sm text-brand-secondary">Your workspace URL.</p>
              </div>
              <div className="col-span-12 flex items-center gap-2 sm:col-span-6">
                <Input
                  id="url"
                  name="url"
                  autoComplete="off"
                  register={register}
                  error={errors.name}
                  className="w-full"
                  value={`${
                    typeof window !== "undefined" &&
                    window.location.origin.replace("http://", "").replace("https://", "")
                  }/${activeWorkspace.slug}`}
                  disabled
                />
                <SecondaryButton
                  className="h-min"
                  onClick={() =>
                    copyTextToClipboard(
                      `${typeof window !== "undefined" && window.location.origin}/${
                        activeWorkspace.slug
                      }`
                    ).then(() => {
                      setToastAlert({
                        type: "success",
                        title: "Link Copied!",
                        message: "Workspace link copied to clipboard.",
                      });
                    })
                  }
                  outline
                >
                  <LinkIcon className="h-[18px] w-[18px]" />
                </SecondaryButton>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4 sm:gap-16">
              <div className="col-span-12 sm:col-span-6">
                <h4 className="text-lg font-semibold">Name</h4>
                <p className="text-sm text-brand-secondary">Give a name to your workspace.</p>
              </div>
              <div className="col-span-12 sm:col-span-6">
                <Input
                  id="name"
                  name="name"
                  placeholder="Name"
                  autoComplete="off"
                  register={register}
                  error={errors.name}
                  validations={{
                    required: "Name is required",
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4 sm:gap-16">
              <div className="col-span-12 sm:col-span-6">
                <h4 className="text-lg font-semibold">Company Size</h4>
                <p className="text-sm text-brand-secondary">How big is your company?</p>
              </div>
              <div className="col-span-12 sm:col-span-6">
                <Controller
                  name="company_size"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <CustomSelect
                      value={value}
                      onChange={onChange}
                      label={value ? value.toString() : "Select company size"}
                      input
                    >
                      {COMPANY_SIZE?.map((item) => (
                        <CustomSelect.Option key={item.value} value={item.value}>
                          {item.label}
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  )}
                />
              </div>
            </div>
            <div className="sm:text-right">
              <SecondaryButton onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Workspace"}
              </SecondaryButton>
            </div>
            <div className="grid grid-cols-12 gap-4 sm:gap-16">
              <div className="col-span-12 sm:col-span-6">
                <h4 className="text-lg font-semibold">Danger Zone</h4>
                <p className="text-sm text-brand-secondary">
                  The danger zone of the workspace delete page is a critical area that requires
                  careful consideration and attention. When deleting a workspace, all of the data
                  and resources within that workspace will be permanently removed and cannot be
                  recovered.
                </p>
              </div>
              <div className="col-span-12 sm:col-span-6">
                <DangerButton onClick={() => setIsOpen(true)} outline>
                  Delete the workspace
                </DangerButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid h-full w-full place-items-center px-4 sm:px-0">
            <Spinner />
          </div>
        )}
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default WorkspaceSettings;
