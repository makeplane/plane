import React, { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { ChevronDown, CircleUserRound, InfoIcon } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { PROFILE_SETTINGS_TRACKER_ELEMENTS, PROFILE_SETTINGS_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IUser, TUserProfile } from "@plane/types";
import { Button, Input, TOAST_TYPE, setPromiseToast, setToast } from "@plane/ui";
// components
import { getButtonStyling } from "@plane/ui/src/button";
import { cn, getFileURL } from "@plane/utils";
import { DeactivateAccountModal } from "@/components/account";
import { ImagePickerPopover, UserImageUploadModal } from "@/components/core";
// helpers
// hooks
import { captureSuccess, captureError } from "@/helpers/event-tracker.helper";
import { useUser, useUserProfile } from "@/hooks/store";

type TUserProfileForm = {
  avatar_url: string;
  cover_image: string;
  cover_image_asset: any;
  cover_image_url: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  role: string;
  language: string;
  user_timezone: string;
};

export type TProfileFormProps = {
  user: IUser;
  profile: TUserProfile;
};

export const ProfileForm = observer((props: TProfileFormProps) => {
  const { user, profile } = props;
  const { workspaceSlug } = useParams();
  // states
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [deactivateAccountModal, setDeactivateAccountModal] = useState(false);
  // language support
  const { t } = useTranslation();
  // form info
  const {
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<TUserProfileForm>({
    defaultValues: {
      avatar_url: user.avatar_url || "",
      cover_image_asset: null,
      cover_image_url: user.cover_image_url || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      display_name: user.display_name || "",
      email: user.email || "",
      role: profile.role || "Product / Project Manager",
      language: profile.language || "en",
      user_timezone: user.user_timezone || "Asia/Kolkata",
    },
  });
  // derived values
  const userAvatar = watch("avatar_url");
  const userCover = watch("cover_image_url");
  // store hooks
  const { data: currentUser, updateCurrentUser } = useUser();
  const { updateUserProfile } = useUserProfile();

  const handleProfilePictureDelete = async (url: string | null | undefined) => {
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

  const onSubmit = async (formData: TUserProfileForm) => {
    setIsLoading(true);
    const userPayload: Partial<IUser> = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      avatar_url: formData.avatar_url,
      display_name: formData?.display_name,
    };
    // if unsplash or a pre-defined image is uploaded, delete the old uploaded asset
    if (formData.cover_image_url?.startsWith("http")) {
      userPayload.cover_image_url = formData.cover_image_url;
      userPayload.cover_image = formData.cover_image_url;
      userPayload.cover_image_asset = null;
    }

    const profilePayload: Partial<TUserProfile> = {
      role: formData.role,
    };

    const updateCurrentUserDetail = updateCurrentUser(userPayload).finally(() => setIsLoading(false));
    const updateCurrentUserProfile = updateUserProfile(profilePayload).finally(() => setIsLoading(false));

    const promises = [updateCurrentUserDetail, updateCurrentUserProfile];
    const updateUserAndProfile = Promise.all(promises);

    setPromiseToast(updateUserAndProfile, {
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
    updateUserAndProfile
      .then(() => {
        captureSuccess({
          eventName: PROFILE_SETTINGS_TRACKER_EVENTS.update_profile,
        });
      })
      .catch(() => {
        captureError({
          eventName: PROFILE_SETTINGS_TRACKER_EVENTS.update_profile,
        });
      });
  };

  return (
    <>
      <DeactivateAccountModal isOpen={deactivateAccountModal} onClose={() => setDeactivateAccountModal(false)} />
      <Controller
        control={control}
        name="avatar_url"
        render={({ field: { onChange, value } }) => (
          <UserImageUploadModal
            isOpen={isImageUploadModalOpen}
            onClose={() => setIsImageUploadModalOpen(false)}
            handleRemove={async () => await handleProfilePictureDelete(currentUser?.avatar_url)}
            onSuccess={(url) => {
              onChange(url);
              handleSubmit(onSubmit)();
              setIsImageUploadModalOpen(false);
            }}
            value={value && value.trim() !== "" ? value : null}
          />
        )}
      />
      <div className="w-full flex text-custom-primary-200 bg-custom-primary-100/10 rounded-md p-2 gap-2 items-center mb-4">
        <InfoIcon className="h-4 w-4 flex-shrink-0" />
        <div className="text-sm font-medium flex-1">{t("settings_moved_to_preferences")}</div>
        <Link
          href={`/${workspaceSlug}/settings/account/preferences`}
          className={cn(getButtonStyling("neutral-primary", "sm"))}
        >
          {t("go_to_preferences")}
        </Link>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
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
                    label={t("change_cover")}
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
                  {t("first_name")}&nbsp;
                  <span className="text-red-500">*</span>
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
                <h4 className="text-sm font-medium text-custom-text-200">{t("last_name")}</h4>
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
                  {t("display_name")}&nbsp;
                  <span className="text-red-500">*</span>
                </h4>
                <Controller
                  control={control}
                  name="display_name"
                  rules={{
                    required: "Display name is required.",
                    validate: (value) => {
                      if (value.trim().length < 1) return "Display name can't be empty.";
                      if (value.split("  ").length > 1) return "Display name can't have two consecutive spaces.";
                      if (value.replace(/\s/g, "").length < 1) return "Display name must be at least 1 character long.";
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
                {errors?.display_name && <span className="text-xs text-red-500">{errors?.display_name?.message}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-medium text-custom-text-200">
                  {t("auth.common.email.label")}&nbsp;
                  <span className="text-red-500">*</span>
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
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between pt-6 pb-8">
              <Button
                variant="primary"
                type="submit"
                loading={isLoading}
                data-ph-element={PROFILE_SETTINGS_TRACKER_ELEMENTS.SAVE_CHANGES_BUTTON}
              >
                {isLoading ? t("saving") : t("save_changes")}
              </Button>
            </div>
          </div>
        </div>
      </form>
      <Disclosure as="div" className="border-t border-custom-border-100 w-full">
        {({ open }) => (
          <>
            <Disclosure.Button as="button" type="button" className="flex w-full items-center justify-between py-4">
              <span className="text-lg font-medium tracking-tight">{t("deactivate_account")}</span>
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
                  <span className="text-sm tracking-tight">{t("deactivate_account_description")}</span>
                  <div>
                    <Button
                      variant="danger"
                      onClick={() => setDeactivateAccountModal(true)}
                      data-ph-element={PROFILE_SETTINGS_TRACKER_ELEMENTS.DEACTIVATE_ACCOUNT_BUTTON}
                    >
                      {t("deactivate_account")}
                    </Button>
                  </div>
                </div>
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>
    </>
  );
});
