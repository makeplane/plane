import React from "react";
import { Controller, useForm } from "react-hook-form";
import { XCircle } from "lucide-react";
import { observer } from "mobx-react-lite";
// services
import { AuthService } from "services/auth.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Input } from "@plane/ui";
// helpers
import { checkEmailValidity } from "helpers/string.helper";
// types
import { IEmailCheckData } from "@plane/types";

type Props = {
  onSubmit: () => void;
  updateEmail: (email: string) => void;
};

type TEmailFormValues = {
  email: string;
};

const authService = new AuthService();

export const SignUpEmailForm: React.FC<Props> = observer((props) => {
  const { onSubmit, updateEmail } = props;
  // hooks
  const { setToastAlert } = useToast();
  const {
    control,
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
  } = useForm<TEmailFormValues>({
    defaultValues: {
      email: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleFormSubmit = async (data: TEmailFormValues) => {
    const payload: IEmailCheckData = {
      email: data.email,
    };

    // update the global email state
    updateEmail(data.email);

    await authService
      .emailCheck(payload)
      .then(() => onSubmit())
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      );
  };

  return (
    <>
      <h1 className="sm:text-2.5xl text-center text-2xl font-medium text-onboarding-text-100">
        Get on your flight deck
      </h1>
      <p className="mt-2.5 text-center text-sm text-onboarding-text-200">
        Create or join a workspace. Start with your e-mail.
      </p>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="mx-auto mt-8 space-y-4 sm:w-96">
        <div className="space-y-1">
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              validate: (value) => checkEmailValidity(value) || "Email is invalid",
            }}
            render={({ field: { value, onChange } }) => (
              <div className="relative flex items-center rounded-md bg-onboarding-background-200">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={value}
                  onChange={onChange}
                  hasError={Boolean(errors.email)}
                  placeholder="name@company.com"
                  className="h-[46px] w-full border border-onboarding-border-100 pr-12 placeholder:text-onboarding-text-400"
                  autoFocus
                />
                {value.length > 0 && (
                  <XCircle
                    className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                    onClick={() => onChange("")}
                  />
                )}
              </div>
            )}
          />
        </div>
        <Button type="submit" variant="primary" className="w-full" size="xl" disabled={!isValid} loading={isSubmitting}>
          Verify
        </Button>
      </form>
    </>
  );
});
