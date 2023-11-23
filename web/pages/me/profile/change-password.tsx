import { ReactElement, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Controller, useForm } from "react-hook-form";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { UserService } from "services/user.service";
// hooks
import useToast from "hooks/use-toast";
// layout
import { ProfileSettingsLayout } from "layouts/settings-layout";
// components
import { ProfileSettingsHeader } from "components/headers";
// ui
import { Button, Input, Spinner } from "@plane/ui";
// types
import { NextPageWithLayout } from "types/app";

interface FormValues {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

const defaultValues: FormValues = {
  old_password: "",
  new_password: "",
  confirm_password: "",
};

const userService = new UserService();

const ChangePasswordPage: NextPageWithLayout = observer(() => {
  const [isPageLoading, setIsPageLoading] = useState(true);

  const {
    appConfig: { envConfig },
  } = useMobxStore();

  const router = useRouter();

  // use form
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues });
  const { setToastAlert } = useToast();

  const handleChangePassword = async (formData: FormValues) => {
    if (formData.new_password !== formData.confirm_password) {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "The new password and the confirm password don't match.",
      });
      return;
    }
    await userService
      .changePassword(formData)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Password changed successfully.",
        });
      })
      .catch((error) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: error?.error ?? "Something went wrong. Please try again.",
        });
      });
  };

  useEffect(() => {
    if (!envConfig) return;

    const enableEmailPassword =
      envConfig?.email_password_login ||
      !(
        envConfig?.email_password_login ||
        envConfig?.magic_login ||
        envConfig?.google_client_id ||
        envConfig?.github_client_id
      );

    if (!enableEmailPassword) router.push("/me/profile");
    else setIsPageLoading(false);
  }, []);

  if (isPageLoading)
    return (
      <div className="grid place-items-center h-screen w-full">
        <Spinner />
      </div>
    );

  return (
    <form onSubmit={handleSubmit(handleChangePassword)} className="flex flex-col gap-8 my-10 w-full mr-9">
      <div className="grid grid-col grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 items-center justify-between gap-10 w-full">
        <div className="flex flex-col gap-1 ">
          <h4 className="text-sm">Current password</h4>
          <Controller
            control={control}
            name="old_password"
            rules={{
              required: "This field is required",
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                id="old_password"
                type="password"
                value={value}
                onChange={onChange}
                placeholder="Old password"
                className="rounded-md font-medium w-full"
                hasError={Boolean(errors.old_password)}
              />
            )}
          />
          {errors.old_password && <span className="text-red-500 text-xs">{errors.old_password.message}</span>}
        </div>

        <div className="flex flex-col gap-1 ">
          <h4 className="text-sm">New password</h4>
          <Controller
            control={control}
            name="new_password"
            rules={{
              required: "This field is required",
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                id="new_password"
                type="password"
                value={value}
                placeholder="New password"
                onChange={onChange}
                className="w-full"
                hasError={Boolean(errors.new_password)}
              />
            )}
          />
          {errors.new_password && <span className="text-red-500 text-xs">{errors.new_password.message}</span>}
        </div>

        <div className="flex flex-col gap-1 ">
          <h4 className="text-sm">Confirm password</h4>
          <Controller
            control={control}
            name="confirm_password"
            rules={{
              required: "This field is required",
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                id="confirm_password"
                type="password"
                placeholder="Confirm password"
                value={value}
                onChange={onChange}
                className="w-full"
                hasError={Boolean(errors.confirm_password)}
              />
            )}
          />
          {errors.confirm_password && <span className="text-red-500 text-xs">{errors.confirm_password.message}</span>}
        </div>
      </div>

      <div className="flex items-center justify-between py-2">
        <Button variant="primary" type="submit" loading={isSubmitting}>
          {isSubmitting ? "Changing password..." : "Change password"}
        </Button>
      </div>
    </form>
  );
});

ChangePasswordPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ProfileSettingsLayout header={<ProfileSettingsHeader title="Change Password" />}>{page}</ProfileSettingsLayout>
  );
};

export default ChangePasswordPage;
