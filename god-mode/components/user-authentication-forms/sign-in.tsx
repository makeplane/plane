import { FC, FormEvent, useEffect, useState } from "react";
// services
import { AuthService } from "@/services/auth.service";
import { API_BASE_URL } from "@/helpers/common.helper";
// ui
import { Button, Input } from "@plane/ui";
import { Eye, EyeOff } from "lucide-react";

type TInstanceFormData = {
  email: string;
  password: string;
};

const defaultInstanceFromData: TInstanceFormData = {
  email: "",
  password: "",
};

// service initialization
const authService = new AuthService();

export const InstanceSignInForm: FC = (props) => {
  const {} = props;
  // state
  const [csrfToken, setCsrfToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [instanceFormData, setInstanceFormData] = useState<TInstanceFormData>(defaultInstanceFromData);
  const handleFormChange = (key: keyof TInstanceFormData, value: string | boolean) =>
    setInstanceFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    authService.requestCSRFToken().then((data) => setCsrfToken(data.csrf_token));
  }, []);

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
              required
            />
          </div>
          <div className="w-full space-y-1">
            <label className="text-sm text-custom-text-300 font-medium" htmlFor="password">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                className="w-full"
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                inputSize="md"
                placeholder="Enter your password"
                value={instanceFormData.password}
                onChange={(e) => handleFormChange("password", e.target.value)}
                required
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
          </div>
          <div className="py-2">
            <Button type="submit" size="lg" className="w-full">
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
