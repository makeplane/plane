import { useEffect } from "react";

import { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// hooks
import useToast from "hooks/use-toast";
// services
import userService from "services/user.service";
// ui
import { CustomSearchSelect, CustomSelect, Input, PrimaryButton } from "components/ui";
// types
import { ICurrentUserResponse, IUser } from "types";
// fetch-keys
import { CURRENT_USER } from "constants/fetch-keys";
// helpers
import { getUserTimeZoneFromWindow } from "helpers/date-time.helper";
// constants
import { USER_ROLES } from "constants/workspace";
import { TIME_ZONES } from "constants/timezones";
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const defaultValues: Partial<IUser> = {
  first_name: "",
  last_name: "",
  role: "",
};

type Props = {
  user?: IUser;
};

const timeZoneOptions = TIME_ZONES.map((timeZone) => ({
  value: timeZone.value,
  query: timeZone.label + " " + timeZone.value,
  content: timeZone.label,
}));

export const UserDetails: React.FC<Props> = ({ user }) => {
  const { setToastAlert } = useToast();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<IUser>({
    defaultValues,
  });

  const store: RootStore = useMobxStore();

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
          title: store.locale.localized("Success!"),
          message: store.locale.localized("Details updated successfully."),
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
        user_timezone: getUserTimeZoneFromWindow(),
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
        <h5>{store.locale.localized("Hey there")} 👋🏻</h5>
        <h5 className="mt-5 mb-6">{store.locale.localized("Let's get you onboard!")}</h5>
        <h4 className="text-xl sm:text-2xl font-semibold">
          {store.locale.localized("Set up your Plane profile.")}
        </h4>
      </div>

      <div className="space-y-7 sm:w-3/4 md:w-2/5">
        <div className="space-y-1 text-sm">
          <label htmlFor="firstName">{store.locale.localized("First Name")}</label>
          <Input
            id="firstName"
            name="first_name"
            autoComplete="off"
            placeholder={store.locale.localized("Enter your first name...")}
            register={register}
            validations={{
              required: store.locale.localized("First name is required"),
              maxLength: {
                value: 24,
                message: store.locale.localized(
                  "First name cannot exceed the limit of 24 characters"
                ),
              },
            }}
            error={errors.first_name}
          />
        </div>
        <div className="space-y-1 text-sm">
          <label htmlFor="lastName">{store.locale.localized("Last Name")}</label>
          <Input
            id="lastName"
            name="last_name"
            autoComplete="off"
            register={register}
            placeholder={store.locale.localized("Enter your last name...")}
            validations={{
              required: store.locale.localized("Last name is required"),
              maxLength: {
                value: 24,
                message: store.locale.localized(
                  "Last name cannot exceed the limit of 24 characters"
                ),
              },
            }}
            error={errors.last_name}
          />
        </div>
        <div className="space-y-1 text-sm">
          <span>{store.locale.localized("What's your role?")}</span>
          <div className="w-full">
            <Controller
              name="role"
              control={control}
              rules={{ required: store.locale.localized("This field is required") }}
              render={({ field: { value, onChange } }) => (
                <CustomSelect
                  value={value}
                  onChange={(val: any) => onChange(val)}
                  label={
                    value ? (
                      value.toString()
                    ) : (
                      <span className="text-custom-text-400">
                        {store.locale.localized("Select your role...")}
                      </span>
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
        <div className="space-y-1 text-sm">
          <span>{store.locale.localized("What time zone are you in?")}</span>
          <div className="w-full">
            <Controller
              name="user_timezone"
              control={control}
              rules={{ required: store.locale.localized("This field is required") }}
              render={({ field: { value, onChange } }) => (
                <CustomSearchSelect
                  value={value}
                  label={
                    value
                      ? TIME_ZONES.find((t) => t.value === value)?.label ?? value
                      : store.locale.localized("Select a timezone")
                  }
                  options={timeZoneOptions}
                  onChange={onChange}
                  verticalPosition="top"
                  optionsClassName="w-full"
                  input
                />
              )}
            />
            {errors?.user_timezone && (
              <span className="text-sm text-red-500">{errors.user_timezone.message}</span>
            )}
          </div>
        </div>
      </div>

      <PrimaryButton type="submit" size="md" disabled={!isValid} loading={isSubmitting}>
        {isSubmitting ? store.locale.localized("Updating...") : store.locale.localized("Continue")}
      </PrimaryButton>
    </form>
  );
};
