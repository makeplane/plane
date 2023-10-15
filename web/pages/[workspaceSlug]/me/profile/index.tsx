import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
// services
import { FileService } from "services/file.service";
import { UserService } from "services/user.service";
// hooks
import useUserAuth from "hooks/use-user-auth";
import useToast from "hooks/use-toast";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout-legacy";
// components
import { ImagePickerPopover, ImageUploadModal } from "components/core";
import { SettingsSidebar } from "components/project";
// ui
import { Button, Input, Spinner } from "@plane/ui";
import { CustomSearchSelect, CustomSelect } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { UserIcon } from "@heroicons/react/24/outline";
import { UserCircle } from "lucide-react";
// types
import type { NextPage } from "next";
import type { IUser } from "types";
// constants
import { USER_ROLES } from "constants/workspace";
import { TIME_ZONES } from "constants/timezones";

const defaultValues: Partial<IUser> = {
  avatar: "",
  cover_image: "",
  first_name: "",
  last_name: "",
  email: "",
  role: "Product / Project Manager",
  user_timezone: "Asia/Kolkata",
};

const fileService = new FileService();
const userService = new UserService();

const Profile: NextPage = () => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // form info
  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<IUser>({ defaultValues });

  const { setToastAlert } = useToast();
  const { user: myProfile, mutateUser } = useUserAuth();

  useEffect(() => {
    reset({ ...defaultValues, ...myProfile });
  }, [myProfile, reset]);

  const onSubmit = async (formData: IUser) => {
    if (formData.first_name === "" || formData.last_name === "") {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "First and last names are required.",
      });

      return;
    }

    const payload: Partial<IUser> = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      avatar: formData.avatar,
      cover_image: formData.cover_image,
      role: formData.role,
      display_name: formData.display_name,
      user_timezone: formData.user_timezone,
    };

    await userService
      .updateUser(payload)
      .then((res) => {
        mutateUser((prevData: any) => {
          if (!prevData) return prevData;

          return { ...prevData, ...res };
        }, false);
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

    fileService.deleteUserFile(url).then(() => {
      if (updateUser)
        userService
          .updateUser({ avatar: "" })
          .then(() => {
            setToastAlert({
              type: "success",
              title: "Success!",
              message: "Profile picture removed successfully.",
            });
            mutateUser((prevData: any) => {
              if (!prevData) return prevData;
              return { ...prevData, avatar: "" };
            }, false);
            setIsRemoving(false);
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

  const timeZoneOptions = TIME_ZONES.map((timeZone) => ({
    value: timeZone.value,
    query: timeZone.label + " " + timeZone.value,
    content: timeZone.label,
  }));

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="My Profile" />
        </Breadcrumbs>
      }
    >
      <ImageUploadModal
        isOpen={isImageUploadModalOpen}
        onClose={() => setIsImageUploadModalOpen(false)}
        isRemoving={isRemoving}
        handleDelete={() => handleDelete(myProfile?.avatar, true)}
        onSuccess={(url) => {
          setValue("avatar", url);
          handleSubmit(onSubmit)();
          setIsImageUploadModalOpen(false);
        }}
        value={watch("avatar") !== "" ? watch("avatar") : undefined}
        userImage
      />
      {myProfile ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-row gap-2 h-full">
            <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
              <SettingsSidebar />
            </div>
            <div className={`flex flex-col gap-8 pr-9 py-9 w-full overflow-y-auto`}>
              <div className="relative h-44 w-full mt-6">
                <img
                  src={watch("cover_image") ?? "https://images.unsplash.com/photo-1506383796573-caf02b4a79ab"}
                  className="h-44 w-full rounded-lg object-cover"
                  alt={myProfile?.first_name ?? "Cover image"}
                />
                <div className="flex items-end justify-between absolute left-8 -bottom-6">
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center bg-custom-background-90 h-16 w-16 rounded-lg">
                      <button type="button" onClick={() => setIsImageUploadModalOpen(true)}>
                        {!watch("avatar") || watch("avatar") === "" ? (
                          <div className="h-16 w-16 rounded-md bg-custom-background-80 p-2">
                            <UserIcon className="h-full w-full text-custom-text-200" />
                          </div>
                        ) : (
                          <div className="relative h-16 w-16 overflow-hidden">
                            <img
                              src={watch("avatar")}
                              className="absolute top-0 left-0 h-full w-full object-cover rounded-lg"
                              onClick={() => setIsImageUploadModalOpen(true)}
                              alt={myProfile.display_name}
                            />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex absolute right-3 bottom-3">
                  <Controller
                    control={control}
                    name="cover_image"
                    render={() => (
                      <ImagePickerPopover
                        label={"Change cover"}
                        onChange={(imageUrl) => {
                          setValue("cover_image", imageUrl);
                        }}
                        control={control}
                        value={watch("cover_image") ?? "https://images.unsplash.com/photo-1506383796573-caf02b4a79ab"}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="flex item-center justify-between px-8 mt-4">
                <div className="flex flex-col">
                  <div className="flex item-center text-lg font-semibold text-custom-text-100">
                    <span>{`${watch("first_name")} ${watch("last_name")}`}</span>
                  </div>
                  <span className="text-sm tracking-tight">{watch("email")}</span>
                </div>

                <Link href={`/${workspaceSlug}/profile/${myProfile.id}`}>
                  <a className="flex item-center cursor-pointer gap-2 h-4 leading-4 text-sm text-custom-primary-100">
                    <span className="h-4 w-4">
                      <UserCircle className="h-4 w-4" />
                    </span>
                    View Profile
                  </a>
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 px-8">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm">First Name</h4>
                  <Controller
                    control={control}
                    name="first_name"
                    render={({ field: { value, onChange, ref } }) => (
                      <Input
                        id="first_name"
                        name="first_name"
                        type="text"
                        value={value}
                        onChange={onChange}
                        ref={ref}
                        hasError={Boolean(errors.first_name)}
                        placeholder="Enter your first name"
                        className="rounded-md font-medium w-full"
                      />
                    )}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <h4 className="text-sm">Last Name</h4>

                  <Controller
                    control={control}
                    name="last_name"
                    render={({ field: { value, onChange, ref } }) => (
                      <Input
                        id="last_name"
                        name="last_name"
                        type="text"
                        value={value}
                        onChange={onChange}
                        ref={ref}
                        hasError={Boolean(errors.last_name)}
                        placeholder="Enter your last name"
                        className="rounded-md font-medium w-full"
                      />
                    )}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <h4 className="text-sm">Email</h4>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { value, onChange, ref } }) => (
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={value}
                        onChange={onChange}
                        ref={ref}
                        hasError={Boolean(errors.email)}
                        placeholder="Enter your last name"
                        className="rounded-md font-medium w-full"
                        disabled
                      />
                    )}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <h4 className="text-sm">Role</h4>
                  <Controller
                    name="role"
                    control={control}
                    rules={{ required: "This field is required" }}
                    render={({ field: { value, onChange } }) => (
                      <CustomSelect
                        value={value}
                        onChange={onChange}
                        label={value ? value.toString() : "Select your role"}
                        buttonClassName={errors.role ? "border-red-500 bg-red-500/10" : ""}
                        width="w-full"
                        input
                      >
                        {USER_ROLES.map((item) => (
                          <CustomSelect.Option key={item.value} value={item.value}>
                            {item.label}
                          </CustomSelect.Option>
                        ))}
                      </CustomSelect>
                    )}
                  />
                  {errors.role && <span className="text-xs text-red-500">Please select a role</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <h4 className="text-sm">Display name </h4>
                  <Controller
                    control={control}
                    name="display_name"
                    rules={{
                      required: "Display name is required.",
                      validate: (value) => {
                        if (value.trim().length < 1) return "Display name can't be empty.";

                        if (value.split("  ").length > 1) return "Display name can't have two consecutive spaces.";

                        if (value.replace(/\s/g, "").length < 1)
                          return "Display name must be at least 1 characters long.";

                        if (value.replace(/\s/g, "").length > 20)
                          return "Display name must be less than 20 characters long.";

                        return true;
                      },
                    }}
                    render={({ field: { value, onChange, ref } }) => (
                      <Input
                        id="display_name"
                        name="display_name"
                        type="text"
                        value={value}
                        onChange={onChange}
                        ref={ref}
                        hasError={Boolean(errors.display_name)}
                        placeholder="Enter your display name"
                        className="w-full"
                      />
                    )}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <h4 className="text-sm">Timezone </h4>

                  <Controller
                    name="user_timezone"
                    control={control}
                    rules={{ required: "This field is required" }}
                    render={({ field: { value, onChange } }) => (
                      <CustomSearchSelect
                        value={value}
                        label={value ? TIME_ZONES.find((t) => t.value === value)?.label ?? value : "Select a timezone"}
                        options={timeZoneOptions}
                        onChange={onChange}
                        optionsClassName="w-full"
                        input
                      />
                    )}
                  />
                  {errors.role && <span className="text-xs text-red-500">Please select a role</span>}
                </div>

                <div className="flex items-center justify-between py-2">
                  <Button variant="primary" type="submit" loading={isSubmitting}>
                    {isSubmitting ? "Updating Profile..." : "Update Profile"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="grid h-full w-full place-items-center px-4 sm:px-0">
          <Spinner />
        </div>
      )}
    </WorkspaceAuthorizationLayout>
  );
};

export default Profile;
