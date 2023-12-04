import React, { useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { XCircle } from "lucide-react";
// services
import { AuthService } from "services/auth.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Input } from "@plane/ui";
// helpers
import { checkEmailValidity } from "helpers/string.helper";
// types
import { IEmailCheckData } from "types/auth";

type Props = {
  email: string;
  updateEmail: (email: string) => void;
};

const authService = new AuthService();

export const SetPasswordLink: React.FC<Props> = (props) => {
  const { email, updateEmail } = props;
  // states
  const [isSendingNewLink, setIsSendingNewLink] = useState(false);

  const { setToastAlert } = useToast();

  const {
    control,
    formState: { errors, isValid },
    watch,
  } = useForm({
    defaultValues: {
      email,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleSendNewLink = async () => {
    setIsSendingNewLink(true);

    const payload: IEmailCheckData = {
      email: watch("email"),
      type: "password",
    };

    await authService
      .emailCheck(payload)
      .then(() =>
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "We have sent a new link to your email.",
        })
      )
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      )
      .finally(() => setIsSendingNewLink(false));
  };

  return (
    <>
      <h1 className="text-center text-2xl sm:text-2.5xl font-medium text-onboarding-text-100">
        Get on your flight deck
      </h1>
      <p className="text-center text-sm text-onboarding-text-200 px-20 mt-3">
        We have sent a link to <span className="font-semibold text-custom-primary-100">{email},</span> so you can set a
        password
      </p>

      <form className="mt-5 sm:w-96 mx-auto space-y-4">
        <div className="space-y-1">
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              validate: (value) => checkEmailValidity(value) || "Email is invalid",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <div className="flex items-center relative rounded-md bg-onboarding-background-200">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={value}
                  onChange={(e) => {
                    updateEmail(e.target.value);
                    onChange(e.target.value);
                  }}
                  ref={ref}
                  hasError={Boolean(errors.email)}
                  placeholder="orville.wright@firstflight.com"
                  className="w-full h-[46px] placeholder:text-onboarding-text-400 border border-onboarding-border-100 pr-12"
                />
                {value.length > 0 && (
                  <XCircle
                    className="h-5 w-5 absolute stroke-custom-text-400 hover:cursor-pointer right-3"
                    onClick={() => onChange("")}
                  />
                )}
              </div>
            )}
          />
        </div>
        <Button
          type="button"
          variant="primary"
          className="w-full"
          size="xl"
          onClick={handleSendNewLink}
          disabled={!isValid}
          loading={isSendingNewLink}
        >
          {isSendingNewLink ? "Sending new link..." : "Get link again"}
        </Button>
        <p className="text-xs text-onboarding-text-200">
          When you click the button above, you agree with our{" "}
          <Link href="https://plane.so/terms-and-conditions" target="_blank" rel="noopener noreferrer">
            <span className="font-semibold underline">terms and conditions of service.</span>
          </Link>
        </p>
      </form>
    </>
  );
};
