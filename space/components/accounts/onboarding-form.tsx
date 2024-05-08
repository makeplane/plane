import React, { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Controller, useForm } from "react-hook-form";
// types
import { IUser } from "@plane/types";
// ui
import { Button, Input, Spinner, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { UserImageUploadModal } from "@/components/accounts";
// hooks
import { useMobxStore } from "@/hooks/store";
// services
import fileService from "@/services/file.service";

type TProfileSetupFormValues = {
  first_name: string;
  last_name: string;
  avatar?: string | null;
};

const defaultValues: Partial<TProfileSetupFormValues> = {
  first_name: "",
  last_name: "",
  avatar: "",
};

type Props = {
  user?: IUser;
  finishOnboarding: () => Promise<void>;
};

export const OnBoardingForm: React.FC<Props> = observer((props) => {
  const { user, finishOnboarding } = props;
  // states
  const [isRemoving, setIsRemoving] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  // store hooks
  const {
    user: { updateCurrentUser },
  } = useMobxStore();
  // form info
  const {
    getValues,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<TProfileSetupFormValues>({
    defaultValues: {
      ...defaultValues,
      first_name: user?.first_name,
      last_name: user?.last_name,
      avatar: user?.avatar,
    },
    mode: "onChange",
  });

  const onSubmit = async (formData: TProfileSetupFormValues) => {
    if (!user) return;

    const userDetailsPayload: Partial<IUser> = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      avatar: formData.avatar,
    };

    try {
      await updateCurrentUser(userDetailsPayload).then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success",
          message: "Profile setup completed!",
        });
        finishOnboarding();
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Profile setup failed. Please try again!",
      });
    }
  };

  const handleDelete = (url: string | null | undefined) => {
    if (!url) return;

    setIsRemoving(true);
    fileService.deleteUserFile(url).finally(() => {
      setValue("avatar", "");
      setIsRemoving(false);
    });
  };

  const isButtonDisabled = useMemo(() => (isValid && !isSubmitting ? false : true), [isSubmitting, isValid]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full mx-auto mt-2 space-y-4 sm:w-96">
      <Controller
        control={control}
        name="avatar"
        render={({ field: { onChange, value } }) => (
          <UserImageUploadModal
            isOpen={isImageUploadModalOpen}
            onClose={() => setIsImageUploadModalOpen(false)}
            isRemoving={isRemoving}
            handleDelete={() => handleDelete(getValues("avatar"))}
            onSuccess={(url) => {
              onChange(url);
              setIsImageUploadModalOpen(false);
            }}
            value={value && value.trim() !== "" ? value : null}
          />
        )}
      />
      <div className="space-y-1 flex items-center justify-center">
        <button type="button" onClick={() => setIsImageUploadModalOpen(true)}>
          {!watch("avatar") || watch("avatar") === "" ? (
            <div className="flex flex-col items-center justify-between">
              <div className="relative h-14 w-14 overflow-hidden">
                <div className="absolute left-0 top-0 flex items-center justify-center h-full w-full rounded-full text-white text-3xl font-medium bg-[#9747FF] uppercase">
                  {watch("first_name")[0] ?? "R"}
                </div>
              </div>
              <div className="pt-1 text-sm font-medium text-custom-primary-300 hover:text-custom-primary-400">
                Choose image
              </div>
            </div>
          ) : (
            <div className="relative mr-3 h-16 w-16 overflow-hidden">
              <img
                src={watch("avatar") || undefined}
                className="absolute left-0 top-0 h-full w-full rounded-full object-cover"
                onClick={() => setIsImageUploadModalOpen(true)}
                alt={user?.display_name}
              />
            </div>
          )}
        </button>
      </div>
      <div className="flex gap-4">
        <div className="space-y-1">
          <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="first_name">
            First name
          </label>
          <Controller
            control={control}
            name="first_name"
            rules={{
              required: "First name is required",
              maxLength: {
                value: 24,
                message: "First name must be within 24 characters.",
              },
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="first_name"
                name="first_name"
                type="text"
                value={value}
                autoFocus
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.first_name)}
                placeholder="RWilbur"
                className="w-full border-onboarding-border-100 focus:border-custom-primary-100"
              />
            )}
          />
          {errors.first_name && <span className="text-sm text-red-500">{errors.first_name.message}</span>}
        </div>
        <div className="space-y-1">
          <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="last_name">
            Last name
          </label>
          <Controller
            control={control}
            name="last_name"
            rules={{
              required: "Last name is required",
              maxLength: {
                value: 24,
                message: "Last name must be within 24 characters.",
              },
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="last_name"
                name="last_name"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.last_name)}
                placeholder="Wright"
                className="w-full border-onboarding-border-100 focus:border-custom-primary-100"
              />
            )}
          />
          {errors.last_name && <span className="text-sm text-red-500">{errors.last_name.message}</span>}
        </div>
      </div>
      <Button variant="primary" type="submit" size="lg" className="w-full" disabled={isButtonDisabled}>
        {isSubmitting ? <Spinner height="20px" width="20px" /> : "Continue"}
      </Button>
    </form>
  );
});
