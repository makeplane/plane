import React, { useEffect, useState } from "react";

import Link from "next/link";
import Image from "next/image";

// react-hook-form
import { useForm } from "react-hook-form";
// lib
import { requiredAuth } from "lib/auth";
// services
import fileService from "services/file.service";
import userService from "services/user.service";
// hooks
import useUser from "hooks/use-user";
import useToast from "hooks/use-toast";
// layouts
import AppLayout from "layouts/app-layout";
// components
import { ImageUploadModal } from "components/core";
// ui
import { DangerButton, Input, SecondaryButton, Spinner } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import {
  ChevronRightIcon,
  PencilIcon,
  RectangleStackIcon,
  UserIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
// types
import type { NextPage, GetServerSidePropsContext } from "next";
import type { IUser } from "types";
import { useRouter } from "next/dist/client/router";

const defaultValues: Partial<IUser> = {
  avatar: "",
  first_name: "",
  last_name: "",
  email: "",
};

const Profile: NextPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IUser>({ defaultValues });

  const { setToastAlert } = useToast();
  const { user: myProfile, mutateUser, assignedIssuesLength, workspaceInvitesLength } = useUser();

  useEffect(() => {
    reset({ ...defaultValues, ...myProfile });
  }, [myProfile, reset]);

  const onSubmit = (formData: IUser) => {
    const payload: Partial<IUser> = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      avatar: formData.avatar,
    };
    userService
      .updateUser(payload)
      .then((res) => {
        mutateUser((prevData) => {
          if (!prevData) return prevData;
          return { ...prevData, user: { ...payload, ...res } };
        }, false);
        setIsEditing(false);
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Profile updated successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "There was some error in updating your profile. Please try again.",
        });
      });
  };

  const handleDelete = (url: string | null | undefined, updateUser: boolean = false) => {
    if (!url) return;

    setIsRemoving(true);

    const index = url.indexOf(".com");
    const asset = url.substring(index + 5);

    fileService.deleteUserFile(asset).then(() => {
      if (updateUser)
        userService
          .updateUser({ avatar: "" })
          .then((res) => {
            setIsRemoving(false);
            setToastAlert({
              type: "success",
              title: "Success!",
              message: "Profile picture removed successfully.",
            });
            mutateUser((prevData) => {
              if (!prevData) return prevData;
              return { ...prevData, user: res };
            }, false);
          })
          .catch(() => {
            setIsRemoving(false);
            setToastAlert({
              type: "error",
              title: "Error!",
              message: "There was some error in deleting your profile picture. Please try again.",
            });
          });
    });
  };

  const quickLinks = [
    {
      icon: RectangleStackIcon,
      title: "Assigned Issues",
      number: assignedIssuesLength,
      description: "View your workspace invitations.",
      href: `/${workspaceSlug}/me/my-issues`,
    },
    {
      icon: UserPlusIcon,
      title: "Workspace Invitations",
      number: workspaceInvitesLength,
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
          handleDelete(myProfile?.avatar);
          setValue("avatar", url);
          handleSubmit(onSubmit)();
          setIsImageUploadModalOpen(false);
        }}
        value={watch("avatar") !== "" ? watch("avatar") : undefined}
        userImage
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
                    <div className="mt-4 flex items-center gap-2">
                      <SecondaryButton onClick={() => setIsImageUploadModalOpen(true)}>
                        Upload new
                      </SecondaryButton>
                      {myProfile.avatar && myProfile.avatar !== "" && (
                        <DangerButton
                          onClick={() => handleDelete(myProfile.avatar, true)}
                          loading={isRemoving}
                        >
                          {isRemoving ? "Removing..." : "Remove"}
                        </DangerButton>
                      )}
                    </div>
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
                      <SecondaryButton type="submit" loading={isSubmitting}>
                        {isSubmitting ? "Updating Profile..." : "Update Profile"}
                      </SecondaryButton>
                    </div>
                  )}
                </form>
              </section>
              <section>
                <h2 className="mb-3 text-xl font-medium">Quick Links</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);

  const redirectAfterSignIn = ctx.resolvedUrl;

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
