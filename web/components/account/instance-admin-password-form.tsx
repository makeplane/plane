import React from "react";
import { useForm, Controller } from "react-hook-form";
// ui
import { Input, Button } from "@plane/ui";

export interface InstanceAdminPasswordFormValues {
  password: string;
}

export interface IInstanceAdminPasswordForm {
  onSubmit: (formData: InstanceAdminPasswordFormValues) => Promise<void>;
}

export const InstanceAdminPasswordForm: React.FC<IInstanceAdminPasswordForm> = (props) => {
  const { onSubmit } = props;
  // form info
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<InstanceAdminPasswordFormValues>({
    defaultValues: {
      password: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  return (
    <>
      <form className="space-y-4 w-full sm:w-[360px] mx-auto" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1">
          <Controller
            control={control}
            name="password"
            rules={{
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Minimum 8 characters required",
              },
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                id="password"
                type="password"
                name="password"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.password)}
                placeholder="Enter your password..."
                className="border-custom-border-300 h-[46px] w-full"
              />
            )}
          />
        </div>
        <div>
          <Button
            variant="primary"
            type="submit"
            className="w-full"
            size="xl"
            disabled={!isValid && isDirty}
            loading={isSubmitting}
          >
            {isSubmitting ? "Loading..." : "Next step"}
          </Button>
        </div>
      </form>
    </>
  );
};
