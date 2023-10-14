import { useEffect } from "react";
import { mutate } from "swr";
import { Controller, useForm } from "react-hook-form";
// hooks
import useToast from "hooks/use-toast";
// services
import { UserService } from "services/user.service";
// ui
import { CustomSearchSelect, CustomSelect } from "components/ui";
import { Button, Input } from "@plane/ui";
// types
import { IUser } from "types";
// fetch-keys
import { CURRENT_USER } from "constants/fetch-keys";
// helpers
import { getUserTimeZoneFromWindow } from "helpers/date-time.helper";
// constants
import { USER_ROLES } from "constants/workspace";
import { TIME_ZONES } from "constants/timezones";

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

const userService = new UserService();

export const UserDetails: React.FC<Props> = ({ user }) => {
  const { setToastAlert } = useToast();

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isValid },
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
        mutate<IUser>(
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
      .catch(() => {
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
        <h5>Hey there 👋🏻</h5>
        <h5 className="mt-5 mb-6">Let{"'"}s get you onboard!</h5>
        <h4 className="text-xl sm:text-2xl font-semibold">Set up your Plane profile.</h4>
      </div>

      <div className="space-y-7 sm:w-3/4 md:w-2/5">
        <div className="space-y-1 text-sm">
          <label htmlFor="firstName">First Name</label>
          <Controller
            control={control}
            name="first_name"
            rules={{
              required: "First name is required",
              maxLength: {
                value: 24,
                message: "First name cannot exceed the limit of 24 characters",
              },
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
                placeholder="Enter your first name..."
                className="w-full"
              />
            )}
          />
        </div>
        <div className="space-y-1 text-sm">
          <label htmlFor="lastName">Last Name</label>
          <Controller
            control={control}
            name="last_name"
            rules={{
              required: "Last name is required",
              maxLength: {
                value: 24,
                message: "Last name cannot exceed the limit of 24 characters",
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
                placeholder="Enter your last name..."
                className="w-full"
              />
            )}
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
                  label={value ? value.toString() : <span className="text-custom-text-400">Select your role...</span>}
                  input
                  width="w-full"
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
          <span>What time zone are you in? </span>
          <div className="w-full">
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
            {errors?.user_timezone && <span className="text-sm text-red-500">{errors.user_timezone.message}</span>}
          </div>
        </div>
      </div>

      <Button variant="primary" type="submit" size="md" disabled={!isValid} loading={isSubmitting}>
        {isSubmitting ? "Updating..." : "Continue"}
      </Button>
    </form>
  );
};
