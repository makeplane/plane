import React from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// icons
import { CircleAlert, XCircle } from "lucide-react";
// types
import { IEmailCheckData } from "@plane/types";
// ui
import { Button, Input } from "@plane/ui";
// helpers
import { checkEmailValidity } from "@/helpers/string.helper";

type Props = {
  onSubmit: (data: IEmailCheckData) => Promise<void>;
};

type TEmailFormValues = {
  email: string;
};

export const SignUpEmailForm: React.FC<Props> = observer((props) => {
  const { onSubmit } = props;
  // hooks
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
    onSubmit(payload);
  };

  return (
    <>
      <div className="text-center space-y-1 py-4 mx-auto sm:w-96">
        <h3 className="text-3xl font-bold text-onboarding-text-100">Create your account</h3>
        <p className="font-medium text-onboarding-text-400">Start tracking your projects with Plane</p>
      </div>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="mx-auto mt-8 space-y-4 sm:w-96">
        <div className="space-y-1">
          <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="email">
            Email <span className="text-red-500">*</span>
          </label>
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              validate: (value) => checkEmailValidity(value) || "Email is invalid",
            }}
            render={({ field: { value, onChange } }) => (
              <>
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
                {errors.email && (
                  <p className="flex items-center gap-1 text-xs text-red-600 px-0.5">
                    <CircleAlert height={12} width={12} />
                    {errors.email.message}
                  </p>
                )}
              </>
            )}
          />
        </div>
        <Button type="submit" variant="primary" className="w-full" size="lg" disabled={!isValid} loading={isSubmitting}>
          Continue
        </Button>
      </form>
    </>
  );
});
