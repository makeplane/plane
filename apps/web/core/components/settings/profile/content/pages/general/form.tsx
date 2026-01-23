import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { CircleUserRound } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/propel/toast";
import { EFileAssetType } from "@plane/types";
import type { IUser, TUserProfile } from "@plane/types";
import { Input } from "@plane/ui";
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
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Profile picture deleted successfully.",
        });
        setValue("avatar_url", "");
        return;
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
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: error instanceof Error ? error.message : "Failed to process cover image",
      });
      setIsLoading(false);
      return;
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
        return;
      })
      .catch(() => {});
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
        <div className="flex w-full flex-col gap-7">
          <div className="relative h-44 w-full">
            <CoverImage
              src={userCover}
              className="h-44 w-full rounded-lg"
              alt={currentUser?.first_name ?? "Cover image"}
            />
            <div className="absolute -bottom-6 left-6 flex items-end justify-between">
              <div className="flex gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-surface-2">
                  <button type="button" onClick={() => setIsImageUploadModalOpen(true)}>
                    {!userAvatar || userAvatar === "" ? (
                      <div className="h-16 w-16 rounded-md bg-layer-1 p-2">
                        <CircleUserRound className="h-full w-full text-secondary" />
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
                    control={control}
                    onChange={(imageUrl) => onChange(imageUrl)}
                    value={value}
                    isProfileCover
                  />
                )}
              />
            </div>
          </div>
          <div className="item-center mt-6 flex justify-between">
            <div className="flex flex-col">
              <div className="item-center flex text-16 font-medium text-secondary">
                <span>{`${watch("first_name")} ${watch("last_name")}`}</span>
              </div>
              <span className="text-13 text-tertiary tracking-tight">{watch("email")}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
              <div className="flex flex-col gap-1">
                <h4 className="text-13 font-medium text-secondary">
                  {t("first_name")}&nbsp;
                  <span className="text-danger-primary">*</span>
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
                      className={`w-full rounded-md ${errors.first_name ? "border-danger-strong" : ""}`}
                      maxLength={24}
                      autoComplete="on"
                    />
                  )}
                />
                {errors.first_name && <span className="text-11 text-danger-primary">{errors.first_name.message}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-13 font-medium text-secondary">{t("last_name")}</h4>
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
                <h4 className="text-13 font-medium text-secondary">
                  {t("display_name")}&nbsp;
                  <span className="text-danger-primary">*</span>
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
                      className={`w-full ${errors?.display_name ? "border-danger-strong" : ""}`}
                      maxLength={24}
                    />
                  )}
                />
                {errors?.display_name && (
                  <span className="text-11 text-danger-primary">{errors?.display_name?.message}</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-13 font-medium text-secondary">
                  {t("auth.common.email.label")}&nbsp;
                  <span className="text-danger-primary">*</span>
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
                      className={`w-full cursor-not-allowed rounded-md !bg-surface-2 ${
                        errors.email ? "border-danger-strong" : ""
                      }`}
                      autoComplete="on"
                      disabled
                    />
                  )}
                />
                {isSMTPConfigured && (
                  <button
                    type="button"
                    className="text-11 underline btn w-fit text-secondary"
                    onClick={() => setIsChangeEmailModalOpen(true)}
                  >
                    {t("account_settings.profile.change_email_modal.title")}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div>
            <Button variant="primary" type="submit" loading={isLoading}>
              {isLoading ? t("saving") : t("save_changes")}
            </Button>
          </div>
        </div>
      </form>
      <div className="mt-10">
        <SettingsBoxedControlItem
          title={t("deactivate_account")}
          description={t("deactivate_account_description")}
          control={
            <Button variant="error-outline" onClick={() => setDeactivateAccountModal(true)}>
              {t("deactivate_account")}
            </Button>
          }
        />
      </div>
    </>
  );
});
