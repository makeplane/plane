import React, { useEffect, useState } from "react";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import type { NextPage, NextPageContext } from "next";

import useSWR from "swr";

import { useForm } from "react-hook-form";

// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// lib
import { requiredAuth } from "lib/auth";
// services
import projectService from "lib/services/project.service";
// layouts
import AppLayout from "layouts/app-layout";
// constants
import { USER_ISSUE, USER_WORKSPACE_INVITATIONS, PROJECTS_LIST } from "constants/fetch-keys";
// services
import userService from "lib/services/user.service";
import fileServices from "lib/services/file.service";
import workspaceService from "lib/services/workspace.service";
// components
import { ImageUploadModal } from "components/common/image-upload-modal";
// ui
import { BreadcrumbItem, Breadcrumbs, Button, Input, Spinner } from "ui";
// icons
import {
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
  RectangleStackIcon,
  UserIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
// types
import type { IIssue, IUser } from "types";

const defaultValues: Partial<IUser> = {
  avatar: "",
  first_name: "",
  last_name: "",
  email: "",
};

const Profile: NextPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);

  const {
    query: { workspaceSlug },
  } = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IUser>({ defaultValues });

  const { setToastAlert } = useToast();
  const { user: myProfile, mutateUser } = useUser();

  const { data: myIssues } = useSWR<IIssue[]>(
    myProfile && workspaceSlug ? USER_ISSUE(workspaceSlug as string) : null,
    myProfile && workspaceSlug ? () => userService.userIssues(workspaceSlug as string) : null
  );

  const { data: invitations } = useSWR(USER_WORKSPACE_INVITATIONS, () =>
    workspaceService.userWorkspaceInvitations()
  );

  const { data: projects } = useSWR(
    workspaceSlug ? PROJECTS_LIST(workspaceSlug as string) : null,
    () => (workspaceSlug ? () => projectService.getProjects(workspaceSlug as string) : null)
  );

  useEffect(() => {
    reset({ ...defaultValues, ...myProfile });
  }, [myProfile, reset]);

  const onSubmit = (formData: IUser) => {
    const payload: Partial<IUser> = {
      id: formData.id,
      first_name: formData.first_name,
      last_name: formData.last_name,
      avatar: formData.avatar,
    };
    userService
      .updateUser(payload)
      .then((response) => {
        mutateUser((prevData) => {
          if (!prevData) return prevData;
          return { ...prevData, user: { ...payload, ...response } };
        });
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

  const quickLinks = [
    {
      icon: RectangleStackIcon,
      title: "My Issues",
      number: myIssues?.length ?? 0,
      description: "View the list of issues assigned to you for this workspace.",
      href: "/me/my-issues",
    },
    {
      icon: ClipboardDocumentListIcon,
      title: "My Projects",
      number: projects?.length ?? 0,
      description: "View the list of projects of the workspace.",
      href: `/${workspaceSlug}/projects`,
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
      noHeader
    >
      <ImageUploadModal
        isOpen={isImageUploadModalOpen}
        onClose={() => setIsImageUploadModalOpen(false)}
        onSuccess={(url) => {
          setValue("avatar", url);
          handleSubmit(onSubmit)();
          setIsImageUploadModalOpen(false);
        }}
        value={watch("avatar")}
      />
      <div className="w-full space-y-5">
        <Breadcrumbs>
          <BreadcrumbItem title="My Profile" />
        </Breadcrumbs>
        {myProfile ? (
          <>
            <div className="space-y-5">
              <section className="relative flex gap-10 rounded-xl bg-secondary p-5">
                <button
                  type="button"
                  className="absolute top-4 right-4 cursor-pointer rounded bg-indigo-100 p-1 duration-300 hover:bg-theme hover:text-white"
                  onClick={() => setIsEditing((prevData) => !prevData)}
                >
                  {isEditing ? (
                    <XMarkIcon className="h-4 w-4" />
                  ) : (
                    <PencilIcon className="h-4 w-4" />
                  )}
                </button>
                <div className="flex-shrink-0">
                  <div className="space-y-4">
                    <div className="relative">
                      <span className="inline-block h-40 w-40 overflow-hidden rounded bg-gray-100">
                        {!watch("avatar") || watch("avatar") === "" ? (
                          <UserIcon className="h-full w-full text-gray-300" />
                        ) : (
                          <div className="relative h-40 w-40 overflow-hidden">
                            <Image
                              src={watch("avatar")}
                              alt={myProfile.first_name}
                              layout="fill"
                              objectFit="cover"
                              priority
                              onClick={() => setIsImageUploadModalOpen(true)}
                            />
                          </div>
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Max file size is 5MB.
                      <br />
                      Supported file types are .jpg and .png.
                    </p>
                    <Button
                      type="button"
                      className="mt-4"
                      onClick={() => {
                        setIsImageUploadModalOpen(true);
                      }}
                    >
                      Upload
                    </Button>
                  </div>
                </div>
                <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                  <div className="mt-2 grid grid-cols-2 gap-x-10 gap-y-5">
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
                      <h2>{myProfile.email}</h2>
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
                <h2 className="mb-3 text-xl font-medium">Quick Links</h2>
                <div className="grid grid-cols-3 gap-5">
                  {quickLinks.map((item, index) => (
                    <Link key={index} href={item.href}>
                      <a className="group rounded-lg bg-secondary p-5 duration-300 hover:bg-theme">
                        <h4 className="flex items-center gap-2 duration-300 group-hover:text-white">
                          {item.title}
                          <ChevronRightIcon className="h-3 w-3" />
                        </h4>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h2 className="mt-3 mb-2 text-3xl font-bold duration-300 group-hover:text-white">
                              {item.number}
                            </h2>
                            <p className="text-sm text-gray-500 duration-300 group-hover:text-white">
                              {item.description}
                            </p>
                          </div>
                          <div>
                            <item.icon className="h-12 w-12 duration-300 group-hover:text-white" />
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
          <div className="mx-auto flex h-full w-full items-center justify-center">
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

export default Profile;
