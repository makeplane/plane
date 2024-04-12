import { FC, FormEvent, useEffect, useState } from "react";
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

type TInstanceFormData = {
  email: string;
  password: string;
};

const defaultInstanceFromData: TInstanceFormData = {
  email: "",
  password: "",
};

type InstanceFormErrors = {
  general?: string;
  email: string;
  password: string;
};

const defaultInstanceFormErrors: InstanceFormErrors = {
  general: "",
  email: "",
  password: "",
};

// service initialization
const authService = new AuthService();

export const InstanceSignInForm: FC = (props) => {
  const {} = props;
  // search params
  const searchParams = useSearchParams();
  // state
  const [csrfToken, setCsrfToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [instanceFormData, setInstanceFormData] = useState<TInstanceFormData>(defaultInstanceFromData);
  const [instanceFormErrors, setInstanceFormErrors] = useState<InstanceFormErrors>(defaultInstanceFormErrors);

  const handleFormChange = (key: keyof TInstanceFormData, value: string | boolean) =>
    setInstanceFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    authService.requestCSRFToken().then((data) => setCsrfToken(data.csrf_token));
  }, []);

  useEffect(() => {
    if (instanceFormData.email && instanceFormData.password) {
      setSubmitDisabled(false);
    } else {
      setSubmitDisabled(true);
    }
  }, [instanceFormData]);

  useEffect(() => {
    const errorCode = searchParams.get("error_code");
    const errorMessage = searchParams.get("error_message");

    if (errorCode) {
      if (errorMessage) {
        if (errorCode === "INVALID_EMAIL") {
          setInstanceFormErrors((prev) => ({ ...prev, email: errorMessage }));
        } else if (errorCode === "INVALID_PASSWORD") {
          setInstanceFormErrors((prev) => ({ ...prev, password: errorMessage }));
        } else {
          setInstanceFormErrors((prev) => ({ ...prev, general: errorMessage }));
        }
      } else {
        setInstanceFormErrors((prev) => ({ ...prev, general: "Something went wrong. Please try again." }));
      }
    }
  }, [searchParams]);

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    console.log(event);
    // validating password
    event.preventDefault();
  };

  return (
    <div className="relative w-full h-full overflow-hidden container mx-auto px-5 md:px-0 flex justify-center items-center">
      <div className="w-full md:w-4/6 lg:w-3/6 xl:w-2/6 space-y-10">
        <div className="text-center space-y-1">
          <h3 className="text-3xl font-bold">Manage your Plane instance</h3>
          <p className="font-medium text-custom-text-400">Configure instance-wide settings to secure your instance</p>
        </div>
        {!!instanceFormErrors.general && <Banner type="error" message={instanceFormErrors.general} />}
        <form
          className="space-y-4"
          method="POST"
          action={`${API_BASE_URL}/api/instances/admins/sign-in/`}
          onSubmit={handleFormSubmit}
        >
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
              value={instanceFormData.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              hasError={!!instanceFormErrors.email}
            />
            <p className="px-1 text-xs text-red-500">{instanceFormErrors.email}</p>
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
                value={instanceFormData.password}
                onChange={(e) => handleFormChange("password", e.target.value)}
                hasError={!!instanceFormErrors.password}
              />
              {showPassword ? (
                <button
                  className="absolute right-3 top-3.5 flex items-center justify-center text-custom-text-400"
                  onClick={() => setShowPassword(false)}
                >
                  <EyeOff className="h-4 w-4" />
                </button>
              ) : (
                <button
                  className="absolute right-3 top-3.5 flex items-center justify-center text-custom-text-400"
                  onClick={() => setShowPassword(true)}
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="px-1 text-xs text-red-500">{instanceFormErrors.password}</p>
          </div>
          <div className="py-2">
            <Button type="submit" size="lg" className="w-full" disabled={submitDisabled}>
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
