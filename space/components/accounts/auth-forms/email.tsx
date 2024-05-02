import React from "react";
import { Controller, useForm } from "react-hook-form";
// icons
import { XCircle, CircleAlert } from "lucide-react";
// ui
import { Button, Input, Spinner } from "@plane/ui";
// helpers
import { checkEmailValidity } from "@/helpers/string.helper";
// types
import { IEmailCheckData } from "@/types/auth";

type Props = {
  onSubmit: (data: IEmailCheckData) => Promise<void>;
};

type TEmailFormValues = {
  email: string;
};

export const EmailForm: React.FC<Props> = (props) => {
  const { onSubmit } = props;

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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-8 space-y-4">
      <div className="space-y-1">
        <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="email">
          Email
        </label>
        <Controller
          control={control}
          name="email"
          rules={{
            required: "Email is required",
            validate: (value) => checkEmailValidity(value) || "Email is invalid",
          }}
          render={({ field: { value, onChange, ref } }) => (
            <>
              <div className="relative flex items-center rounded-md bg-onboarding-background-200">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={value}
                  onChange={onChange}
                  ref={ref}
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
      <Button type="submit" variant="primary" className="w-full" size="lg" disabled={!isValid || isSubmitting}>
        {isSubmitting ? <Spinner height="20px" width="20px" /> : "Continue"}
      </Button>
    </form>
  );
};
