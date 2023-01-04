import React, { useEffect, useState } from "react";

import Image from "next/image";
import { NextPageContext } from "next";
import { useRouter } from "next/router";

import useSWR from "swr";

import { useForm } from "react-hook-form";

import { Tab } from "@headlessui/react";

import Dropzone from "react-dropzone";
// services
import workspaceService from "lib/services/workspace.service";
import fileServices from "lib/services/file.service";
// lib
import { requiredAuth } from "lib/auth";
// layouts
import AppLayout from "layouts/app-layout";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// components
import ConfirmWorkspaceDeletion from "components/workspace/confirm-workspace-deletion";
// ui
import { Spinner, Button, Input, Select, BreadcrumbItem, Breadcrumbs } from "ui";
// types
import type { IWorkspace } from "types";
// constants
import { WORKSPACE_DETAILS } from "constants/fetch-keys";

const defaultValues: Partial<IWorkspace> = {
  name: "",
};

const WorkspaceSettings = () => {
  const { mutateWorkspaces } = useUser();

  const {
    query: { workspaceSlug },
  } = useRouter();

  const { setToastAlert } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IWorkspace>({
    defaultValues: { ...defaultValues, ...activeWorkspace },
  });

  useEffect(() => {
    activeWorkspace && reset({ ...activeWorkspace });
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
      .then(async (res) => {
        await mutateWorkspaces((workspaces) => {
          return (workspaces ?? []).map((workspace) => {
            if (workspace.slug === activeWorkspace.slug) {
              return {
                ...workspace,
                ...res,
              };
            }
            return workspace;
          });
        }, false);
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Workspace updated successfully",
        });
      })
      .catch((err) => console.log(err));
  };

  return (
    <AppLayout
      meta={{
        title: "Plane - Workspace Settings",
      }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title={`${activeWorkspace?.name ?? "Workspace"} Settings`} />
        </Breadcrumbs>
      }
    >
      <ConfirmWorkspaceDeletion
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        data={activeWorkspace ?? null}
      />
      <div className="space-y-5">
        {activeWorkspace ? (
          <div className="space-y-8">
            <Tab.Group>
              <Tab.List className="flex items-center gap-3">
                {["General", "Actions"].map((tab, index) => (
                  <Tab
                    key={index}
                    className={({ selected }) =>
                      `text-md rounded px-4 py-1 leading-6 text-gray-900 outline-none ${
                        selected ? "bg-gray-700 text-white" : "hover:bg-gray-200"
                      } duration-300`
                    }
                  >
                    {tab}
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="w-full space-y-3">
                      <Dropzone
                        multiple={false}
                        accept={{
                          "image/*": [],
                        }}
                        onDrop={(files) => {
                          setImage(files[0]);
                        }}
                      >
                        {({ getRootProps, getInputProps }) => (
                          <div>
                            <input {...getInputProps()} />
                            <div className="mb-2 text-gray-500">Logo</div>
                            <div>
                              <div className="h-60 bg-blue-50" {...getRootProps()}>
                                {((watch("logo") &&
                                  watch("logo") !== null &&
                                  watch("logo") !== "") ||
                                  (image && image !== null)) && (
                                  <div className="relative mx-auto flex h-60">
                                    <Image
                                      src={image ? URL.createObjectURL(image) : watch("logo") ?? ""}
                                      alt="Workspace Logo"
                                      objectFit="cover"
                                      layout="fill"
                                      priority
                                    />
                                  </div>
                                )}
                              </div>
                              <p className="mt-2 text-sm text-gray-500">
                                Max file size is 500kb. Supported file types are .jpg and .png.
                              </p>
                            </div>
                          </div>
                        )}
                      </Dropzone>
                      <div>
                        <Button
                          onClick={() => {
                            if (image === null) return;
                            setIsImageUploading(true);
                            const formData = new FormData();
                            formData.append("asset", image);
                            formData.append("attributes", JSON.stringify({}));
                            fileServices
                              .uploadFile(formData)
                              .then((response) => {
                                const imageUrl = response.asset;
                                setValue("logo", imageUrl);
                                handleSubmit(onSubmit)();
                                setIsImageUploading(false);
                              })
                              .catch((err) => {
                                setIsImageUploading(false);
                              });
                          }}
                        >
                          {isImageUploading ? "Uploading..." : "Upload"}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Input
                          id="name"
                          name="name"
                          label="Name"
                          placeholder="Name"
                          autoComplete="off"
                          register={register}
                          error={errors.name}
                          validations={{
                            required: "Name is required",
                          }}
                        />
                      </div>
                      <div>
                        <Select
                          id="company_size"
                          name="company_size"
                          label="How large is your company?"
                          options={[
                            { value: 5, label: "5" },
                            { value: 10, label: "10" },
                            { value: 25, label: "25" },
                            { value: 50, label: "50" },
                          ]}
                        />
                      </div>
                      <div className="text-right">
                        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                          {isSubmitting ? "Updating..." : "Update"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Tab.Panel>
                <Tab.Panel>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-semibold text-red-500">Danger Zone</h2>
                    <p className="w-full md:w-1/2">
                      The danger zone of the workspace delete page is a critical area that requires
                      careful consideration and attention. When deleting a workspace, all of the
                      data and resources within that workspace will be permanently removed and
                      cannot be recovered.
                    </p>
                    <Button theme="danger" onClick={() => setIsOpen(true)}>
                      Delete the workspace
                    </Button>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        ) : (
          <div className="grid h-full w-full place-items-center px-4 sm:px-0">
            <Spinner />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export const getServerSideProps = async (ctx: NextPageContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);

  const redirectAfterSignIn = ctx.req?.url;

  if (!user) {
    return {
      redirect: {
        destination: `/signin?next=${redirectAfterSignIn}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
};

export default WorkspaceSettings;
