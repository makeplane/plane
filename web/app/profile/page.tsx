"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { ChevronDown, CircleUserRound } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
import type { IUser } from "@plane/types";
import {
  Button,
  CustomSelect,
  CustomSearchSelect,
  Input,
  TOAST_TYPE,
  setPromiseToast,
  setToast,
  Tooltip,
} from "@plane/ui";
// components
import { DeactivateAccountModal } from "@/components/account";
import { LogoSpinner } from "@/components/common";
import { ImagePickerPopover, UserImageUploadModal, PageHead } from "@/components/core";
import { ProfileSettingContentWrapper } from "@/components/profile";
// constants
import { TIME_ZONES, TTimezone } from "@/constants/timezones";
import { USER_ROLES } from "@/constants/workspace";
// helpers
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useUser } from "@/hooks/store";

const defaultValues: Partial<IUser> = {
  avatar_url: "",
  cover_image_url: "",
  first_name: "",
  last_name: "",
  display_name: "",
  email: "",
  role: "Product / Project Manager",
  user_timezone: "Asia/Kolkata",
};

const ProfileSettingsPage = observer(() => {
  // states
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [deactivateAccountModal, setDeactivateAccountModal] = useState(false);
  // form info
  const {
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<IUser>({ defaultValues });
  // derived values
  const userAvatar = watch("avatar_url");
  const userCover = watch("cover_image_url");
  // store hooks
  const { data: currentUser, updateCurrentUser } = useUser();

  useEffect(() => {
    reset({ ...defaultValues, ...currentUser });
  }, [currentUser, reset]);

  const onSubmit = async (formData: IUser) => {
    setIsLoading(true);
    const payload: Partial<IUser> = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      avatar_url: formData.avatar_url,
      role: formData.role,
      display_name: formData?.display_name,
      user_timezone: formData.user_timezone,
    };
    // if unsplash or a pre-defined image is uploaded, delete the old uploaded asset
    if (formData.cover_image_url?.startsWith("http")) {
      payload.cover_image = formData.cover_image_url;
      payload.cover_image_asset = null;
    }

    const updateCurrentUserDetail = updateCurrentUser(payload).finally(() => setIsLoading(false));
    setPromiseToast(updateCurrentUserDetail, {
      loading: "Updating...",
      success: {
        title: "Success!",
        message: () => `Profile updated successfully.`,
      },
      error: {
        title: "Error!",
        message: () => `There was some error in updating your profile. Please try again.`,
      },
    });
  };

  const handleDelete = async (url: string | null | undefined) => {
    if (!url) return;

    await updateCurrentUser({
      avatar_url: "",
    })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Profile picture deleted successfully.",
        });
        setValue("avatar_url", "");
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "There was some error in deleting your profile picture. Please try again.",
        });
      })
      .finally(() => {
        setIsImageUploadModalOpen(false);
      });
  };

  const getTimeZoneLabel = (timezone: TTimezone | undefined) => {
    if (!timezone) return undefined;
    return (
      <div className="flex gap-1.5">
        <span className="text-custom-text-400">{timezone.gmtOffset}</span>
        <span className="text-custom-text-200">{timezone.name}</span>
      </div>
    );
  };

  const timeZoneOptions = TIME_ZONES.map((timeZone) => ({
    value: timeZone.value,
    query: timeZone.name + " " + timeZone.gmtOffset + " " + timeZone.value,
    content: getTimeZoneLabel(timeZone),
  }));

  if (!currentUser)
    return (
      <div className="grid h-full w-full place-items-center px-4 sm:px-0">
        <LogoSpinner />
      </div>
    );

  return (
    <>
      <PageHead title="Profile - General Settings" />
      <ProfileSettingContentWrapper>
        <Controller
          control={control}
          name="avatar_url"
          render={({ field: { onChange, value } }) => (
            <UserImageUploadModal
              isOpen={isImageUploadModalOpen}
              onClose={() => setIsImageUploadModalOpen(false)}
              handleRemove={async () => await handleDelete(currentUser?.avatar_url)}
              onSuccess={(url) => {
                onChange(url);
                handleSubmit(onSubmit)();
                setIsImageUploadModalOpen(false);
              }}
              value={value && value.trim() !== "" ? value : null}
            />
          )}
        />
        <DeactivateAccountModal isOpen={deactivateAccountModal} onClose={() => setDeactivateAccountModal(false)} />
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex w-full flex-col gap-6">
            <div className="relative h-44 w-full">
              <img
                src={userCover ? getFileURL(userCover) : "https://images.unsplash.com/photo-1506383796573-caf02b4a79ab"}
                className="h-44 w-full rounded-lg object-cover"
                alt={currentUser?.first_name ?? "Cover image"}
              />
              <div className="absolute -bottom-6 left-6 flex items-end justify-between">
                <div className="flex gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-custom-background-90">
                    <button type="button" onClick={() => setIsImageUploadModalOpen(true)}>
                      {!userAvatar || userAvatar === "" ? (
                        <div className="h-16 w-16 rounded-md bg-custom-background-80 p-2">
                          <CircleUserRound className="h-full w-full text-custom-text-200" />
                        </div>
                      ) : (
                        <div className="relative h-16 w-16 overflow-hidden">
                          <img
                            src={getFileURL(userAvatar)}
                            className="absolute left-0 top-0 h-full w-full rounded-lg object-cover"
                            onClick={() => setIsImageUploadModalOpen(true)}
                            alt={currentUser?.display_name}
                            role="button"
                          />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-3 right-3 flex">
                <Controller
                  control={control}
                  name="cover_image_url"
                  render={({ field: { value, onChange } }) => (
                    <ImagePickerPopover
                      label={"Change cover"}
                      onChange={(imageUrl) => onChange(imageUrl)}
                      control={control}
                      value={value ?? "https://images.unsplash.com/photo-1506383796573-caf02b4a79ab"}
                      isProfileCover
                    />
                  )}
                />
              </div>
            </div>
            <div className="item-center mt-6 flex justify-between">
              <div className="flex flex-col">
                <div className="item-center flex text-lg font-medium text-custom-text-200">
                  <span>{`${watch("first_name")} ${watch("last_name")}`}</span>
                </div>
                <span className="text-sm text-custom-text-300 tracking-tight">{watch("email")}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-medium text-custom-text-200">
                    First name<span className="text-red-500">*</span>
                  </h4>
                  <Controller
                    control={control}
                    name="first_name"
                    rules={{
                      required: "Please enter first name",
                    }}
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
                        className={`w-full rounded-md ${errors.first_name ? "border-red-500" : ""}`}
                        maxLength={24}
                        autoComplete="on"
                      />
                    )}
                  />
                  {errors.first_name && <span className="text-xs text-red-500">{errors.first_name.message}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-medium text-custom-text-200">Last name</h4>
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
                        className="w-full rounded-md"
                        maxLength={24}
                        autoComplete="on"
                      />
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-medium text-custom-text-200">
                    Display name<span className="text-red-500">*</span>
                  </h4>
                  <Controller
                    control={control}
                    name="display_name"
                    rules={{
                      required: "Display name is required.",
                      validate: (value) => {
                        if (value.trim().length < 1) return "Display name can't be empty.";
                        if (value.split("  ").length > 1) return "Display name can't have two consecutive spaces.";
                        if (value.replace(/\s/g, "").length < 1)
                          return "Display name must be at least 1 character long.";
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
                        hasError={Boolean(errors?.display_name)}
                        placeholder="Enter your display name"
                        className={`w-full ${errors?.display_name ? "border-red-500" : ""}`}
                        maxLength={24}
                      />
                    )}
                  />
                  {errors?.display_name && (
                    <span className="text-xs text-red-500">{errors?.display_name?.message}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-medium text-custom-text-200">
                    Email<span className="text-red-500">*</span>
                  </h4>
                  <Controller
                    control={control}
                    name="email"
                    rules={{
                      required: "Email is required.",
                    }}
                    render={({ field: { value, ref } }) => (
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={value}
                        ref={ref}
                        hasError={Boolean(errors.email)}
                        placeholder="Enter your email"
                        className={`w-full cursor-not-allowed rounded-md !bg-custom-background-90 ${
                          errors.email ? "border-red-500" : ""
                        }`}
                        autoComplete="on"
                        disabled
                      />
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-medium text-custom-text-200">
                    Role<span className="text-red-500">*</span>
                  </h4>
                  <Controller
                    name="role"
                    control={control}
                    rules={{ required: "Role is required." }}
                    render={({ field: { value, onChange } }) => (
                      <CustomSelect
                        value={value}
                        onChange={onChange}
                        label={value ? value.toString() : "Select your role"}
                        buttonClassName={errors.role ? "border-red-500" : "border-none"}
                        className="rounded-md border-[0.5px] !border-custom-border-200"
                        optionsClassName="w-full"
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
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-medium text-custom-text-200">
                    Timezone<span className="text-red-500">*</span>
                  </h4>
                  <Controller
                    name="user_timezone"
                    control={control}
                    rules={{ required: "Please select a timezone" }}
                    render={({ field: { value, onChange } }) => (
                      <CustomSearchSelect
                        value={value}
                        label={
                          value
                            ? (getTimeZoneLabel(TIME_ZONES.find((t) => t.value === value)) ?? value)
                            : "Select a timezone"
                        }
                        options={timeZoneOptions}
                        onChange={onChange}
                        buttonClassName={errors.user_timezone ? "border-red-500" : ""}
                        className="rounded-md border-[0.5px] !border-custom-border-200"
                        optionsClassName="w-72"
                        input
                      />
                    )}
                  />
                  {errors.user_timezone && <span className="text-xs text-red-500">{errors.user_timezone.message}</span>}
                </div>
                <Tooltip tooltipContent="Coming soon" position="bottom">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-medium text-custom-text-200">Language</h4>
                    <CustomSearchSelect
                      value="English (US)"
                      label="English (US)"
                      options={[]}
                      onChange={() => {}}
                      className="rounded-md bg-custom-background-90"
                      input
                      disabled
                    />
                  </div>
                </Tooltip>
              </div>
              <div className="flex items-center justify-between pt-6 pb-8">
                <Button variant="primary" type="submit" loading={isLoading}>
                  {isLoading ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          </div>
        </form>
        <Disclosure as="div" className="border-t border-custom-border-100">
          {({ open }) => (
            <>
              <Disclosure.Button as="button" type="button" className="flex w-full items-center justify-between py-4">
                <span className="text-lg font-medium tracking-tight">Deactivate account</span>
                <ChevronDown className={`h-5 w-5 transition-all ${open ? "rotate-180" : ""}`} />
              </Disclosure.Button>
              <Transition
                show={open}
                enter="transition duration-100 ease-out"
                enterFrom="transform opacity-0"
                enterTo="transform opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform opacity-100"
                leaveTo="transform opacity-0"
              >
                <Disclosure.Panel>
                  <div className="flex flex-col gap-8">
                    <span className="text-sm tracking-tight">
                      When deactivating an account, all of the data and resources within that account will be
                      permanently removed and cannot be recovered.
                    </span>
                    <div>
                      <Button variant="danger" onClick={() => setDeactivateAccountModal(true)}>
                        Deactivate account
                      </Button>
                    </div>
                  </div>
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      </ProfileSettingContentWrapper>
    </>
  );
});

export default ProfileSettingsPage;
