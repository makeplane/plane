import React, { useEffect, useState } from "react";

import Image from "next/image";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// services
import fileService from "services/file.service";
import userService from "services/user.service";
// hooks
import useUser from "hooks/use-user";
import useToast from "hooks/use-toast";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import { ImageUploadModal } from "components/core";
// ui
import { CustomSelect, DangerButton, Input, SecondaryButton, Spinner } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { UserIcon } from "@heroicons/react/24/outline";
// types
import type { NextPage } from "next";
import type { IUser } from "types";
// constants
import { USER_ROLES } from "constants/workspace";

const defaultValues: Partial<IUser> = {
  avatar: "",
  first_name: "",
  last_name: "",
  email: "",
  role: "",
};

const Profile: NextPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<IUser>({ defaultValues });

  const { setToastAlert } = useToast();
  const { user: myProfile, mutateUser } = useUser();

  useEffect(() => {
    reset({ ...defaultValues, ...myProfile });
  }, [myProfile, reset]);

  const onSubmit = async (formData: IUser) => {
    const payload: Partial<IUser> = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      avatar: formData.avatar,
      role: formData.role,
    };

    await userService
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
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "There was some error in updating your profile. Please try again.",
        })
      );
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
            setToastAlert({
              type: "error",
              title: "Error!",
              message: "There was some error in deleting your profile picture. Please try again.",
            });
          })
          .finally(() => setIsRemoving(false));
    });
  };

  return (
    <WorkspaceAuthorizationLayout
      meta={{
        title: "Plane - My Profile",
      }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="My Profile" />
        </Breadcrumbs>
      }
      profilePage
    >
      <ImageUploadModal
        isOpen={isImageUploadModalOpen}
        onClose={() => setIsImageUploadModalOpen(false)}
        onSuccess={(url) => {
          setValue("avatar", url);
          handleSubmit(onSubmit)();
          setIsImageUploadModalOpen(false);
        }}
        value={watch("avatar") !== "" ? watch("avatar") : undefined}
        userImage
      />
      {myProfile ? (
        <div className="space-y-8 sm:space-y-12">
          <div className="grid grid-cols-12 gap-4 sm:gap-16">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-xl font-semibold">Profile Picture</h4>
              <p className="text-gray-500">
                Max file size is 5MB. Supported file types are .jpg and .png.
              </p>
            </div>
            <div className="col-span-12 sm:col-span-6">
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setIsImageUploadModalOpen(true)}>
                  {!watch("avatar") || watch("avatar") === "" ? (
                    <div className="bg-gray-100 h-12 w-12 p-2 rounded-md">
                      <UserIcon className="h-full w-full text-gray-300" />
                    </div>
                  ) : (
                    <div className="relative h-12 w-12 overflow-hidden">
                      <Image
                        src={watch("avatar")}
                        alt={myProfile.first_name}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-md"
                        onClick={() => setIsImageUploadModalOpen(true)}
                        priority
                      />
                    </div>
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <SecondaryButton
                    onClick={() => {
                      setIsImageUploadModalOpen(true);
                    }}
                  >
                    Upload
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
          </div>
          <div className="grid grid-cols-12 gap-4 sm:gap-16">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-xl font-semibold">Full Name</h4>
              <p className="text-gray-500">
                This name will be reflected on all the projects you are working on.
              </p>
            </div>
            <div className="col-span-12 sm:col-span-6 flex items-center gap-2">
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
              <Input
                name="last_name"
                register={register}
                error={errors.last_name}
                id="last_name"
                placeholder="Enter your last name"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 sm:gap-16">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-xl font-semibold">Email</h4>
              <p className="text-gray-500">The email address that you are using.</p>
            </div>
            <div className="col-span-12 sm:col-span-6">
              <Input
                id="email"
                name="email"
                autoComplete="off"
                register={register}
                error={errors.name}
                className="w-full"
                disabled
              />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 sm:gap-16">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-xl font-semibold">Role</h4>
              <p className="text-gray-500">Add your role.</p>
            </div>
            <div className="col-span-12 sm:col-span-6">
              <Controller
                name="role"
                control={control}
                rules={{ required: "This field is required" }}
                render={({ field: { value, onChange } }) => (
                  <CustomSelect
                    value={value}
                    onChange={onChange}
                    label={value ? value.toString() : "Select your role"}
                    width="w-full"
                    input
                    position="right"
                  >
                    {USER_ROLES.map((item) => (
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
              {isSubmitting ? "Updating..." : "Update profile"}
            </SecondaryButton>
          </div>
        </div>
      ) : (
        <div className="grid h-full w-full place-items-center px-4 sm:px-0">
          <Spinner />
        </div>
      )}
    </WorkspaceAuthorizationLayout>
  );
};

export default Profile;
