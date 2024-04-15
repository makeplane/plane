"use client";

import { FC, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
// services
import { AuthService } from "@/services/auth.service";
// ui
import { Button, Input } from "@plane/ui";
// components
import { Banner } from "components/common";
// icons
import { Eye, EyeOff } from "lucide-react";
// helpers
import { API_BASE_URL, cn } from "@/helpers/common.helper";

// service initialization
const authService = new AuthService();

// error codes
enum EErrorCodes {
  INSTANCE_NOT_CONFIGURED = "INSTANCE_NOT_CONFIGURED",
  REQUIRED_EMAIL_PASSWORD = "REQUIRED_EMAIL_PASSWORD",
  INVALID_EMAIL = "INVALID_EMAIL",
  USER_DOES_NOT_EXIST = "USER_DOES_NOT_EXIST",
  AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
}

type TError = {
  type: EErrorCodes | undefined;
  message: string | undefined;
};

const defaultErrorData: TError = {
  type: undefined,
  message: undefined,
};

// form data
type TFormData = {
  email: string;
  password: string;
};

const defaultFromData: TFormData = {
  email: "",
  password: "",
};

export const InstanceSignInForm: FC = (props) => {
  const {} = props;
  // search params
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error_code") || undefined;
  const errorMessage = searchParams.get("error_message") || undefined;
  // state
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorData, setErrorData] = useState<TError>(defaultErrorData);
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState<TFormData>(defaultFromData);

  const handleFormChange = (key: keyof TFormData, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (csrfToken === undefined) authService.requestCSRFToken().then((data) => setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  useEffect(() => {
    if (formData.email && formData.password) setIsButtonDisabled(false);
    else setIsButtonDisabled(true);
  }, [formData]);

  useEffect(() => {
    if (errorCode && errorMessage)
      switch (errorCode) {
        case EErrorCodes.INSTANCE_NOT_CONFIGURED:
          setErrorData({ type: EErrorCodes.INVALID_EMAIL, message: errorMessage });
          break;
        case EErrorCodes.REQUIRED_EMAIL_PASSWORD:
          setErrorData({ type: EErrorCodes.REQUIRED_EMAIL_PASSWORD, message: errorMessage });
          break;
        case EErrorCodes.INVALID_EMAIL:
          setErrorData({ type: EErrorCodes.INVALID_EMAIL, message: errorMessage });
          break;
        case EErrorCodes.USER_DOES_NOT_EXIST:
          setErrorData({ type: EErrorCodes.USER_DOES_NOT_EXIST, message: errorMessage });
          break;
        case EErrorCodes.AUTHENTICATION_FAILED:
          setErrorData({ type: EErrorCodes.AUTHENTICATION_FAILED, message: errorMessage });
          break;
        default:
          setErrorData({ type: undefined, message: undefined });
          break;
      }
  }, [errorCode, errorMessage]);

  useEffect(() => {
    if (errorCode && errorMessage)
      setTimeout(() => {
        setErrorData({ type: undefined, message: undefined });
      }, 3000);
  }, [errorCode, errorMessage]);

  return (
    <div className="relative w-full h-full overflow-hidden container mx-auto px-5 md:px-0 flex justify-center items-center">
      <div className="w-full md:w-4/6 lg:w-3/6 xl:w-2/6 space-y-10">
        <div className="text-center space-y-1">
          <h3 className="text-3xl font-bold">Manage your Plane instance</h3>
          <p className="font-medium text-custom-text-400">Configure instance-wide settings to secure your instance</p>
        </div>

        {errorData.type && errorData?.message && <Banner type="error" message={errorData?.message} />}

        <form className="space-y-4" method="POST" action={`${API_BASE_URL}/api/instances/admins/sign-in/`}>
          <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />

          <div className="w-full space-y-1">
            <label className="text-sm text-custom-text-300 font-medium" htmlFor="email">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              className="w-full"
              id="email"
              name="email"
              type="email"
              inputSize="md"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
            />
          </div>

          <div className="w-full space-y-1">
            <label className="text-sm text-custom-text-300 font-medium" htmlFor="password">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                className={cn("w-full pr-10")}
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                inputSize="md"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleFormChange("password", e.target.value)}
              />
              {showPassword ? (
                <button
                  type="button"
                  className="absolute right-3 top-3.5 flex items-center justify-center text-custom-text-400"
                  onClick={() => setShowPassword(false)}
                >
                  <EyeOff className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  className="absolute right-3 top-3.5 flex items-center justify-center text-custom-text-400"
                  onClick={() => setShowPassword(true)}
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="py-2">
            <Button type="submit" size="lg" className="w-full" disabled={isButtonDisabled}>
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
