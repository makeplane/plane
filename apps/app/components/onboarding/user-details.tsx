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
  setStep: React.Dispatch<React.SetStateAction<number | null>>;
};

export const UserDetails: React.FC<Props> = ({ user, setStep }) => {
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
    await userService
      .updateUser(formData)
      .then(() => {
        mutate<ICurrentUserResponse>(
          CURRENT_USER,
          (prevData) => {
            if (!prevData) return prevData;

            return {
              ...prevData,
              ...formData,
            };
          },
          false
        );

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Details updated successfully.",
        });
        setStep(2);
      })
      .catch((err) => {
        console.log(err);
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
    <form className="w-full space-y-10" onSubmit={handleSubmit(onSubmit)}>
      <div className="relative text-lg">
        <div className="text-custom-primary-100 absolute -top-1 -left-3">{'"'}</div>
        <h5>Hey there 👋🏻</h5>
        <h5 className="mt-5 mb-6">Let{"'"}s get you onboard!</h5>
        <h4 className="text-2xl font-semibold">Set up your Plane profile.</h4>
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
