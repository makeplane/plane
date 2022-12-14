import React, { useState } from "react";
// react hook form
import { useForm } from "react-hook-form";
// ui
import { Button, Input } from "ui";
import authenticationService from "lib/services/authentication.service";
// icons
import { CheckCircleIcon } from "@heroicons/react/20/solid";

// types
type SignIn = {
  email: string;
  key?: string;
  token?: string;
};

const EmailCodeForm = ({ onSuccess }: any) => {
  const [codeSent, setCodeSent] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting, dirtyFields, isValid, isDirty },
  } = useForm<SignIn>({
    defaultValues: {
      email: "",
      key: "",
      token: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const onSubmit = ({ email }: SignIn) => {
    console.log(email);

    authenticationService
      .emailCode({ email })
      .then((res) => {
        setValue("key", res.key);
        setCodeSent(true);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleSignin = (formData: SignIn) => {
    authenticationService
      .magicSignIn(formData)
      .then(async (response) => {
        await onSuccess(response);
      })
      .catch((error) => {
        console.log(error);
        setError("token" as keyof SignIn, {
          type: "manual",
          message: error.error,
        });
      });
  };

  return (
    <>
      <form
        className="mt-5 space-y-5"
        onSubmit={codeSent ? handleSubmit(handleSignin) : handleSubmit(onSubmit)}
      >
        {codeSent && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Please check your mail for code.
                </p>
              </div>
            </div>
          </div>
        )}
        <div>
          <Input
            id="email"
            type="email"
            name="email"
            register={register}
            validations={{
              required: "Email ID is required",
              validate: (value) =>
                /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                  value
                ) || "Email ID is not valid",
            }}
            error={errors.email}
            placeholder="Enter your Email ID"
          />
        </div>

        {codeSent && (
          <div>
            <Input
              id="token"
              type="token"
              name="token"
              register={register}
              validations={{
                required: "Code is required",
              }}
              error={errors.token}
              placeholder="Enter code"
            />
          </div>
        )}
        <div>
          <Button
            disabled={isSubmitting || (!isValid && isDirty)}
            className="w-full text-center"
            type="submit"
          >
            {isSubmitting ? "Signing in..." : codeSent ? "Sign In" : "Continue with Email ID"}
          </Button>
        </div>
      </form>
    </>
  );
};

export default EmailCodeForm;
