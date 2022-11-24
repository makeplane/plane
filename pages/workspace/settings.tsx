import React, { useEffect, useState } from "react";
// next
import Image from "next/image";
// react hook form
import { useForm } from "react-hook-form";
// react dropzone
import Dropzone from "react-dropzone";
// services
import workspaceService from "lib/services/workspace.service";
import fileServices from "lib/services/file.services";
// layouts
import ProjectLayout from "layouts/ProjectLayout";

// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// components
import ConfirmWorkspaceDeletion from "components/workspace/ConfirmWorkspaceDeletion";
// ui
import { Spinner, Button, Input, Select } from "ui";
import { BreadcrumbItem, Breadcrumbs } from "ui/Breadcrumbs";
// types
import type { IWorkspace } from "types";

const defaultValues: Partial<IWorkspace> = {
  name: "",
};

const WorkspaceSettings = () => {
  const { activeWorkspace, mutateWorkspaces } = useUser();

  const { setToastAlert } = useToast();

  const [isOpen, setIsOpen] = useState(false);

  const [image, setImage] = useState<File | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);

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
    <ProjectLayout
      meta={{
        title: "Plane - Workspace Settings",
      }}
    >
      <ConfirmWorkspaceDeletion isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="w-full h-full space-y-5">
        <Breadcrumbs>
          <BreadcrumbItem title={`${activeWorkspace?.name} Settings`} />
        </Breadcrumbs>
        <div className="w-full h-full flex flex-col space-y-3">
          {activeWorkspace ? (
            <div className="space-y-8">
              <section className="space-y-5">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">General</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This information will be displayed to every member of the workspace.
                  </p>
                </div>
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
                          <div className="text-gray-500 mb-2">Logo</div>
                          <div>
                            <div className="w-1/2 aspect-square bg-blue-50" {...getRootProps()}>
                              {((watch("logo") && watch("logo") !== null && watch("logo") !== "") ||
                                (image && image !== null)) && (
                                <div className="relative flex mx-auto h-full">
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
                            <p className="text-sm text-gray-500 mt-2">
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
              </section>
              <section className="space-y-5">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Actions</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Once deleted, it will be gone forever. Please be certain.
                  </p>
                </div>
                <div>
                  <Button theme="danger" onClick={() => setIsOpen(true)}>
                    Delete the workspace
                  </Button>
                </div>
              </section>
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

export default WorkspaceSettings;
