/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { Avatar } from "@makeplane/propel/components/avatar";
import { InputField } from "@makeplane/propel/components/input-field";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { setPromiseToast, setToast } from "@plane/blocks/toast";
import { EFileAssetType } from "@plane/types";
import type { IUser, TUserProfile } from "@plane/types";

import { getFileURL } from "@plane/utils";
// components
import { DeactivateAccountModal } from "@/components/account/deactivate-account-modal";
import { ImagePickerPopover } from "@/components/core/image-picker-popover";
import { ChangeEmailModal } from "@/components/core/modals/change-email-modal";
import { UserImageUploadModal } from "@/components/core/modals/user-image-upload-modal";
import { CoverImage } from "@/components/common/cover-image";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
// helpers
import { handleCoverImageChange } from "@/helpers/cover-image.helper";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
import { useUser, useUserProfile } from "@/hooks/store/user";
// utils
import { validatePersonName, validateDisplayName } from "@plane/utils";

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

type Props = {
  user: IUser;
  profile: TUserProfile;
};

export const GeneralProfileSettingsForm = observer(function GeneralProfileSettingsForm(props: Props) {
  const { user, profile } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [deactivateAccountModal, setDeactivateAccountModal] = useState(false);
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);
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
  const { config } = useInstance();

  const isSMTPConfigured = config?.is_smtp_configured || false;

  const handleProfilePictureDelete = async (url: string | null | undefined) => {
    if (!url) return;
    await updateCurrentUser({
      avatar_url: "",
    })
      .then(() => {
        setToast({
          type: "success",
          title: "Success!",
          message: "Profile picture deleted successfully.",
        });
        setValue("avatar_url", "");
        return;
      })
      .catch(() => {
        setToast({
          type: "error",
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

    try {
      const coverImagePayload = await handleCoverImageChange(user.cover_image_url, formData.cover_image_url, {
        entityIdentifier: "",
        entityType: EFileAssetType.USER_COVER,
        isUserAsset: true,
      });

      if (coverImagePayload) {
        Object.assign(userPayload, coverImagePayload);
      }
    } catch (error) {
      console.error("Error handling cover image:", error);
      setToast({
        type: "error",
        title: t("toast.error"),
        message: error instanceof Error ? error.message : "Failed to process cover image",
      });
      setIsLoading(false);
      return;
    }

    const profilePayload: Partial<TUserProfile> = {
      role: formData.role,
    };

    const updateCurrentUserDetail = updateCurrentUser(userPayload);
    const promises: Promise<IUser | TUserProfile | undefined>[] = [updateCurrentUserDetail];
    if (profilePayload.role !== profile.role) {
      const updateCurrentUserProfile = updateUserProfile(profilePayload);
      promises.push(updateCurrentUserProfile);
    }

    const updatePromise = Promise.allSettled(promises)
      .then((results) => {
        const rejectedResult = results.find((result) => result.status === "rejected") as
          | PromiseRejectedResult
          | undefined;
        if (rejectedResult) {
          throw rejectedResult.reason ?? new Error("Failed to update profile");
        }
        const values = results.map(
          (result) => (result as PromiseFulfilledResult<IUser | TUserProfile | undefined>).value
        );
        if (values.some((v) => v === undefined)) {
          throw new Error("Failed to update profile");
        }
        return values;
      })
      .finally(() => setIsLoading(false));

    setPromiseToast(updatePromise, {
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

  return (
    <>
      <DeactivateAccountModal isOpen={deactivateAccountModal} onClose={() => setDeactivateAccountModal(false)} />
      <ChangeEmailModal isOpen={isChangeEmailModalOpen} onClose={() => setIsChangeEmailModalOpen(false)} />
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
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <div className="flex w-full flex-col gap-6">
          <div className="relative h-[149px] w-full overflow-hidden rounded-lg bg-layer-2">
            <CoverImage
              src={userCover}
              className="absolute inset-0 size-full"
              alt={currentUser?.first_name ?? "Cover image"}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/70" />
            <div className="absolute inset-x-4 bottom-4 z-5 flex h-10 items-end justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="flex shrink-0 rounded-full"
                  onClick={() => setIsImageUploadModalOpen(true)}
                  aria-label="Upload profile image"
                >
                  <Avatar
                    size="xl"
                    src={userAvatar ? getFileURL(userAvatar) : undefined}
                    alt={currentUser?.display_name}
                  />
                </button>
                <div className="flex min-w-0 flex-col text-on-color">
                  <span className="truncate text-body-sm-medium">{`${watch("first_name")} ${watch("last_name")}`}</span>
                  <span className="truncate text-body-xs-regular">{watch("email")}</span>
                </div>
              </div>
              <Controller
                control={control}
                name="cover_image_url"
                render={({ field: { value, onChange } }) => (
                  <ImagePickerPopover
                    label={t("change_cover")}
                    control={control}
                    onChange={(imageUrl) => onChange(imageUrl)}
                    value={value}
                    isProfileCover
                  />
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
            <Controller
              control={control}
              name="first_name"
              rules={{
                required: "Please enter first name",
                validate: validatePersonName,
              }}
              render={({ field: { value, onChange, ref } }) => (
                <InputField
                  size="lg"
                  orientation="vertical"
                  id="first_name"
                  name="first_name"
                  type="text"
                  label={t("first_name")}
                  required
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  error={errors.first_name?.message}
                  placeholder="Enter your first name"
                  maxLength={50}
                  autoComplete="on"
                />
              )}
            />
            <Controller
              control={control}
              name="last_name"
              rules={{
                validate: validatePersonName,
              }}
              render={({ field: { value, onChange, ref } }) => (
                <InputField
                  size="lg"
                  orientation="vertical"
                  id="last_name"
                  name="last_name"
                  type="text"
                  label={t("last_name")}
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  error={errors.last_name?.message}
                  placeholder="Enter your last name"
                  maxLength={50}
                  autoComplete="on"
                />
              )}
            />
            <Controller
              control={control}
              name="display_name"
              rules={{
                required: "Display name is required.",
                validate: validateDisplayName,
              }}
              render={({ field: { value, onChange, ref } }) => (
                <InputField
                  size="lg"
                  orientation="vertical"
                  id="display_name"
                  name="display_name"
                  type="text"
                  label={t("display_name")}
                  required
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  error={errors?.display_name?.message}
                  placeholder="Enter your display name"
                  maxLength={50}
                />
              )}
            />
            <div className="flex flex-col gap-1">
              <Controller
                control={control}
                name="email"
                rules={{
                  required: "Email is required.",
                }}
                render={({ field: { value, ref } }) => (
                  <InputField
                    size="lg"
                    orientation="vertical"
                    id="email"
                    name="email"
                    type="email"
                    label={t("auth.common.email.label")}
                    required
                    value={value}
                    ref={ref}
                    error={errors.email?.message}
                    placeholder="Enter your email"
                    autoComplete="on"
                    disabled
                  />
                )}
              />
              {isSMTPConfigured && (
                <button
                  type="button"
                  className="btn w-fit text-caption-sm-regular text-secondary underline"
                  onClick={() => setIsChangeEmailModalOpen(true)}
                >
                  {t("account_settings.profile.change_email_modal.title")}
                </button>
              )}
            </div>
          </div>
          <div>
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              type="submit"
              label={isLoading ? t("saving") : t("save_changes")}
              loading={isLoading}
            />
          </div>
        </div>
      </form>
      <div className="mt-10">
        <SettingsBoxedControlItem
          title={t("deactivate_account")}
          description={t("deactivate_account_description")}
          control={
            <Button
              variant="danger-outline"
              size="sm"
              stretch="auto"
              label={t("deactivate_account")}
              onClick={() => setDeactivateAccountModal(true)}
            />
          }
        />
      </div>
    </>
  );
});
