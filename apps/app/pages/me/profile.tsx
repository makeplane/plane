import React, { useEffect, useState } from "react";
// next
import Image from "next/image";
import type { NextPage } from "next";
// react hook form
import { useForm } from "react-hook-form";
// react dropzone
import Dropzone, { useDropzone } from "react-dropzone";
// hooks
import useUser from "lib/hooks/useUser";
// layouts
import AppLayout from "layouts/AppLayout";
// services
import userService from "lib/services/user.service";
import fileServices from "lib/services/file.services";
// ui
import { BreadcrumbItem, Breadcrumbs, Button, Input, Spinner } from "ui";
// types
import type { IIssue, IUser, IWorkspaceInvitation } from "types";
import {
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
  RectangleStackIcon,
  UserIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import useSWR from "swr";
import { USER_ISSUE, USER_WORKSPACE_INVITATIONS } from "constants/fetch-keys";
import useToast from "lib/hooks/useToast";
import Link from "next/link";
import workspaceService from "lib/services/workspace.service";

const defaultValues: Partial<IUser> = {
  avatar: "",
  first_name: "",
  last_name: "",
  email: "",
};

const Profile: NextPage = () => {
  const [image, setImage] = useState<File | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { user: myProfile, mutateUser, projects } = useUser();

  const { setToastAlert } = useToast();

  const onSubmit = (formData: IUser) => {
    userService
      .updateUser(formData)
      .then((response) => {
        mutateUser(response, false);
        setIsEditing(false);
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Profile updated successfully",
        });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IUser>({ defaultValues });

  const { data: myIssues } = useSWR<IIssue[]>(
    myProfile ? USER_ISSUE : null,
    myProfile ? () => userService.userIssues() : null
  );

  const { data: invitations } = useSWR<IWorkspaceInvitation[]>(USER_WORKSPACE_INVITATIONS, () =>
    workspaceService.userWorkspaceInvitations()
  );

  useEffect(() => {
    reset({ ...defaultValues, ...myProfile });
  }, [myProfile, reset]);

  const quickLinks = [
    {
      icon: RectangleStackIcon,
      title: "My Issues",
      number: myIssues?.length ?? 0,
      description: "View the list of issues assigned to you across the workspace.",
      href: "/me/my-issues",
    },
    {
      icon: ClipboardDocumentListIcon,
      title: "My Projects",
      number: projects?.length ?? 0,
      description: "View the list of projects of the workspace.",
      href: "/projects",
    },
    {
      icon: UserPlusIcon,
      title: "Workspace Invitations",
      number: invitations?.length ?? 0,
      description: "View your workspace invitations.",
      href: "/invitations",
    },
  ];

  return (
    <AppLayout
      meta={{
        title: "Plane - My Profile",
      }}
    >
      <div className="w-full space-y-5">
        <Breadcrumbs>
          <BreadcrumbItem title="My Profile" />
        </Breadcrumbs>
        {myProfile ? (
          <>
            <div className="space-y-5">
              <section className="relative p-5 rounded-xl flex gap-10 bg-secondary">
                <div
                  className="absolute top-4 right-4 bg-indigo-100 hover:bg-theme hover:text-white rounded p-1 cursor-pointer duration-300"
                  onClick={() => setIsEditing((prevData) => !prevData)}
                >
                  {isEditing ? (
                    <XMarkIcon className="h-4 w-4" />
                  ) : (
                    <PencilIcon className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-shrink-0">
                  <Dropzone
                    multiple={false}
                    accept={{
                      "image/*": [],
                    }}
                    onDrop={(files) => {
                      setImage(files[0]);
                    }}
                  >
                    {({ getRootProps, getInputProps, open }) => (
                      <div className="space-y-4">
                        <input {...getInputProps()} />
                        <div className="relative">
                          <span
                            className="inline-block h-40 w-40 rounded overflow-hidden bg-gray-100"
                            {...getRootProps()}
                          >
                            {(!watch("avatar") || watch("avatar") === "") &&
                            (!image || image === null) ? (
                              <UserIcon className="h-full w-full text-gray-300" />
                            ) : (
                              <div className="relative h-40 w-40 overflow-hidden">
                                <Image
                                  src={image ? URL.createObjectURL(image) : watch("avatar")}
                                  alt={myProfile.first_name}
                                  layout="fill"
                                  objectFit="cover"
                                  priority
                                />
                              </div>
                            )}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm">
                          Max file size is 500kb.
                          <br />
                          Supported file types are .jpg and .png.
                        </p>
                        <Button
                          type="button"
                          className="mt-4"
                          onClick={() => {
                            if (image === null) open();
                            else {
                              setIsImageUploading(true);
                              const formData = new FormData();
                              formData.append("asset", image);
                              formData.append("attributes", JSON.stringify({}));
                              fileServices
                                .uploadFile(formData)
                                .then((response) => {
                                  const imageUrl = response.asset;
                                  setValue("avatar", imageUrl);
                                  handleSubmit(onSubmit)();
                                  setIsImageUploading(false);
                                })
                                .catch((err) => {
                                  setIsImageUploading(false);
                                });
                            }
                          }}
                        >
                          {isImageUploading ? "Uploading..." : "Upload"}
                        </Button>
                      </div>
                    )}
                  </Dropzone>
                </div>
                <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                  <div className="grid grid-cols-2 gap-x-10 gap-y-5 mt-2">
                    <div>
                      <h4 className="text-sm text-gray-500">First Name</h4>
                      {isEditing ? (
                        <Input
                          name="first_name"
                          id="first_name"
                          register={register}
                          error={errors.first_name}
                          placeholder="Enter your first name"
                          autoComplete="off"
                          validations={{
                            required: "This field is required.",
                          }}
                        />
                      ) : (
                        <h2>{myProfile.first_name}</h2>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-500">Last Name</h4>
                      {isEditing ? (
                        <Input
                          name="last_name"
                          register={register}
                          error={errors.last_name}
                          id="last_name"
                          placeholder="Enter your last name"
                          autoComplete="off"
                        />
                      ) : (
                        <h2>{myProfile.last_name}</h2>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-500">Email ID</h4>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          register={register}
                          error={errors.email}
                          name="email"
                          validations={{
                            required: "Email is required",
                          }}
                          placeholder="Enter email"
                        />
                      ) : (
                        <h2>{myProfile.email}</h2>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <div>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Updating Profile..." : "Update Profile"}
                      </Button>
                    </div>
                  )}
                </form>
              </section>
              <section>
                <h2 className="text-xl font-medium mb-3">Quick Links</h2>
                <div className="grid grid-cols-3 gap-5">
                  {quickLinks.map((item, index) => (
                    <Link key={index} href={item.href}>
                      <a className="group p-5 rounded-lg bg-secondary hover:bg-theme duration-300">
                        <h4 className="group-hover:text-white flex items-center gap-2 duration-300">
                          {item.title}
                          <ChevronRightIcon className="h-3 w-3" />
                        </h4>
                        <div className="flex justify-between items-center gap-3">
                          <div>
                            <h2 className="mt-3 mb-2 text-3xl font-bold group-hover:text-white duration-300">
                              {item.number}
                            </h2>
                            <p className="text-gray-500 group-hover:text-white text-sm duration-300">
                              {item.description}
                            </p>
                          </div>
                          <div>
                            <item.icon className="h-12 w-12 group-hover:text-white duration-300" />
                          </div>
                        </div>
                      </a>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : (
          <div className="w-full mx-auto h-full flex justify-center items-center">
            <Spinner />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Profile;
