import { useEffect } from "react";

import { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// hooks
import useToast from "hooks/use-toast";
// services
import userService from "services/user.service";
// ui
import { CustomSelect, Input, PrimaryButton } from "components/ui";
// types
import { ICurrentUserResponse, IUser } from "types";
// fetch-keys
import { CURRENT_USER } from "constants/fetch-keys";
// constants
import { USER_ROLES } from "constants/workspace";

const defaultValues: Partial<IUser> = {
  first_name: "",
  last_name: "",
  role: "",
};

type Props = {
  user?: IUser;
};

export const UserDetails: React.FC<Props> = ({ user }) => {
  const { setToastAlert } = useToast();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IUser>({
    defaultValues,
  });

  const onSubmit = async (formData: IUser) => {
    if (!user) return;

    const payload: Partial<IUser> = {
      ...formData,
      onboarding_step: {
        ...user.onboarding_step,
        profile_complete: true,
      },
    };

    await userService
      .updateUser(payload)
      .then(() => {
        mutate<ICurrentUserResponse>(
          CURRENT_USER,
          (prevData) => {
            if (!prevData) return prevData;

            return {
              ...prevData,
              ...payload,
            };
          },
          false
        );

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Details updated successfully.",
        });
      })
      .catch((err) => {
        mutate(CURRENT_USER);
      });
  };

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      });
    }
  }, [user, reset]);

  return (
    <form
      className="h-full w-full space-y-7 sm:space-y-10 overflow-y-auto sm:flex sm:flex-col sm:items-start sm:justify-center"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="relative sm:text-lg">
        <div className="text-custom-primary-100 absolute -top-1 -left-3">{'"'}</div>
        <h5>Hey there 👋🏻</h5>
        <h5 className="mt-5 mb-6">Let{"'"}s get you onboard!</h5>
        <h4 className="text-xl sm:text-2xl font-semibold">Set up your Plane profile.</h4>
      </div>

      <div className="space-y-7 sm:w-3/4 md:w-2/5">
        <div className="space-y-1 text-sm">
          <label htmlFor="firstName">First Name</label>
          <Input
            id="firstName"
            name="first_name"
            autoComplete="off"
            placeholder="Enter your first name..."
            register={register}
            validations={{
              required: "First name is required",
            }}
            error={errors.first_name}
          />
        </div>
        <div className="space-y-1 text-sm">
          <label htmlFor="lastName">Last Name</label>
          <Input
            id="lastName"
            name="last_name"
            autoComplete="off"
            register={register}
            placeholder="Enter your last name..."
            validations={{
              required: "Last name is required",
            }}
            error={errors.last_name}
          />
        </div>
        <div className="space-y-1 text-sm">
          <span>What{"'"}s your role?</span>
          <div className="w-full">
            <Controller
              name="role"
              control={control}
              rules={{ required: "This field is required" }}
              render={({ field: { value, onChange } }) => (
                <CustomSelect
                  value={value}
                  onChange={(val: any) => onChange(val)}
                  label={
                    value ? (
                      value.toString()
                    ) : (
                      <span className="text-gray-400">Select your role...</span>
                    )
                  }
                  input
                  width="w-full"
                  verticalPosition="top"
                >
                  {USER_ROLES.map((item) => (
                    <CustomSelect.Option key={item.value} value={item.value}>
                      {item.label}
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              )}
            />
            {errors.role && <span className="text-sm text-red-500">{errors.role.message}</span>}
          </div>
        </div>
      </div>

      <PrimaryButton type="submit" size="md" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Continue"}
      </PrimaryButton>
    </form>
  );
};
