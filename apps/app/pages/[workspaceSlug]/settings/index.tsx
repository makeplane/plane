import React, { useEffect, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";

// icons
import { LinkIcon } from "@heroicons/react/24/outline";
// lib
import { requiredWorkspaceAdmin } from "lib/auth";
// services
import workspaceService from "services/workspace.service";
import fileService from "services/file.service";
// hooks
import useToast from "hooks/use-toast";
// layouts
import AppLayout from "layouts/app-layout";
// components
import { ImageUploadModal } from "components/core";
import { DeleteWorkspaceModal } from "components/workspace";
// ui
import { Spinner, Input, CustomSelect, OutlineButton, SecondaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import type { IWorkspace, UserAuth } from "types";
import type { GetServerSideProps, NextPage } from "next";
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

const WorkspaceSettings: NextPage<UserAuth> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

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
      .updateWorkspace(activeWorkspace.slug, payload)
      .then((res) => {
        mutate<IWorkspace[]>(USER_WORKSPACES, (prevData) =>
          prevData?.map((workspace) => (workspace.id === res.id ? res : workspace))
        );
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Workspace updated successfully",
        });
      })
      .catch((err) => console.error(err));
  };

  const handleDelete = (url: string | null | undefined) => {
    if (!url) return;

    const index = url.indexOf(".com");
    const asset = url.substring(index + 5);

    fileService.deleteFile(asset);
  };

  return (
    <AppLayout
      memberType={props}
      meta={{
        title: "Plane - Workspace Settings",
      }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title={`${activeWorkspace?.name ?? "Workspace"} Settings`} />
        </Breadcrumbs>
      }
      settingsLayout
    >
      <ImageUploadModal
        isOpen={isImageUploadModalOpen}
        onClose={() => setIsImageUploadModalOpen(false)}
        onSuccess={(imageUrl) => {
          setIsImageUploading(true);
          handleDelete(activeWorkspace?.logo);
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
      />
      {activeWorkspace ? (
        <div className="space-y-8 sm:space-y-12">
          <div className="grid grid-cols-12 gap-4 sm:gap-16">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-xl font-semibold">Logo</h4>
              <p className="text-gray-500">
                Max file size is 5MB. Supported file types are .jpg and .png.
              </p>
            </div>
            <div className="col-span-12 sm:col-span-6">
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setIsImageUploadModalOpen(true)}>
                  {watch("logo") && watch("logo") !== null && watch("logo") !== "" ? (
                    <div className="relative mx-auto flex h-12 w-12">
                      <Image
                        src={watch("logo")!}
                        alt="Workspace Logo"
                        objectFit="cover"
                        layout="fill"
                        className="rounded-md"
                        priority
                      />
                    </div>
                  ) : (
                    <div className="relative flex h-12 w-12 items-center justify-center rounded bg-gray-700 p-4 uppercase text-white">
                      {activeWorkspace?.name?.charAt(0) ?? "N"}
                    </div>
                  )}
                </button>
                <div>
                  <SecondaryButton
                    onClick={() => {
                      setIsImageUploadModalOpen(true);
                    }}
                  >
                    {isImageUploading ? "Uploading..." : "Upload"}
                  </SecondaryButton>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 sm:gap-16">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-xl font-semibold">URL</h4>
              <p className="text-gray-500">Your workspace URL.</p>
            </div>
            <div className="col-span-12 flex items-center gap-2 sm:col-span-6">
              <Input
                id="url"
                name="url"
                autoComplete="off"
                register={register}
                error={errors.name}
                className="w-full"
                value={`app.plane.so/${activeWorkspace.slug}`}
                disabled
              />
              <SecondaryButton
                className="h-min"
                onClick={() =>
                  copyTextToClipboard(`https://app.plane.so/${activeWorkspace.slug}`).then(() => {
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
              <h4 className="text-xl font-semibold">Name</h4>
              <p className="text-gray-500">Give a name to your workspace.</p>
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
              <h4 className="text-xl font-semibold">Company Size</h4>
              <p className="text-gray-500">How big is your company?</p>
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
              <h4 className="text-xl font-semibold">Danger Zone</h4>
              <p className="text-gray-500">
                The danger zone of the workspace delete page is a critical area that requires
                careful consideration and attention. When deleting a workspace, all of the data and
                resources within that workspace will be permanently removed and cannot be recovered.
              </p>
            </div>
            <div className="col-span-12 sm:col-span-6">
              <OutlineButton theme="danger" onClick={() => setIsOpen(true)}>
                Delete the workspace
              </OutlineButton>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid h-full w-full place-items-center px-4 sm:px-0">
          <Spinner />
        </div>
      )}
    </AppLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const workspaceSlug = ctx.params?.workspaceSlug as string;

  const memberDetail = await requiredWorkspaceAdmin(workspaceSlug, ctx.req.headers.cookie);

  if (memberDetail === null) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      isOwner: memberDetail?.role === 20,
      isMember: memberDetail?.role === 15,
      isViewer: memberDetail?.role === 10,
      isGuest: memberDetail?.role === 5,
    },
  };
};

export default WorkspaceSettings;
