import { FC, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { CheckIcon, Eye, EyeOff } from "lucide-react";
import { Button, Input } from "@plane/ui";
// images
import PlaneBlackLogo from "public/plane-logos/black-horizontal-with-blue-logo.svg";
import PlaneWhiteLogo from "public/plane-logos/white-horizontal-with-blue-logo.svg";

type TForm = {
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  password: string;
  is_telemetry_enabled: boolean;
};

export const MiniGodModeForm: FC = (props) => {
  const {} = props;
  // theme
  const { resolvedTheme } = useTheme();
  const planeLogo = resolvedTheme === "dark" ? PlaneWhiteLogo : PlaneBlackLogo;
  // states
  const [revealPassword, setRevealPassword] = useState(false);
  const [instanceFormData, setInstanceFormData] = useState<TForm>({
    first_name: "",
    last_name: "",
    email: "",
    company_name: "",
    password: "",
    is_telemetry_enabled: true,
  });
  const handleFormChange = (key: keyof TForm, value: string | boolean) =>
    setInstanceFormData((prev) => ({ ...prev, [key]: value }));

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(instanceFormData);

    const formData = new FormData();

    Object.entries(instanceFormData).forEach(([key, value]) => {
      formData.append(key as keyof TForm, value);
    });
  };

  return (
    <div className="bg-onboarding-gradient-100 h-screen max-h-auto">
      <div className="relative container px-5 md:px-0 mx-auto flex flex-col w-full h-full overflow-y-auto">
        <div className="flex-shrink-0 py-12">
          <Image src={planeLogo} className="h-[40px]" alt="Plane logo" />
        </div>
        <div className="w-full flex-grow pt-8">
          <div className="mx-auto sm:w-4/5 md:w-2/3 h-full rounded-t-md border-x border-t border-custom-border-100 bg-onboarding-gradient-100 px-4 pt-4 shadow-sm ">
            <div className="relative h-full rounded-t-md bg-onboarding-gradient-200 px-0 md:px-7">
              <div className="relative flex flex-col items-center pt-12 pb-20 gap-12">
                <div className="text-2xl font-medium">Get started with Plane</div>
                <form className="relative flex flex-col gap-4 px-5 md:px-0" onSubmit={handleFormSubmit}>
                  <div className="relative flex flex-col md:flex-row gap-4">
                    {/* first name */}
                    <div className="w-full space-y-2">
                      <div className="text-sm text-custom-text-300 font-medium">
                        First Name <span className="text-red-500">*</span>
                      </div>
                      <Input
                        className="h-[40px] w-full border border-onboarding-border-100 pr-12 placeholder:text-onboarding-text-400"
                        id="first_name"
                        name="first_name"
                        type="text"
                        placeholder="Wilbur"
                        value={instanceFormData.first_name}
                        onChange={(e) => handleFormChange("first_name", e.target.value)}
                        required
                        autoFocus
                      />
                    </div>

                    {/* last name */}
                    <div className="w-full space-y-2">
                      <div className="text-sm text-custom-text-300 font-medium">Last Name</div>
                      <Input
                        className="h-[40px] w-full border border-onboarding-border-100 pr-12 placeholder:text-onboarding-text-400"
                        id="last_name"
                        name="last_name"
                        type="text"
                        placeholder="Wright"
                        value={instanceFormData.last_name}
                        onChange={(e) => handleFormChange("last_name", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* email */}
                  <div className="w-full space-y-2">
                    <div className="text-sm text-custom-text-300 font-medium">
                      Email <span className="text-red-500">*</span>
                    </div>
                    <div>
                      <Input
                        className="h-[40px] w-full border border-onboarding-border-100 pr-12 placeholder:text-onboarding-text-400"
                        id="email"
                        name="email"
                        type="email"
                        placeholder="wilburwright@frstflit.com"
                        value={instanceFormData.email}
                        onChange={(e) => handleFormChange("email", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* company name */}
                  <div className="w-full space-y-2">
                    <div className="text-sm text-custom-text-300 font-medium">Company Name</div>
                    <Input
                      className="h-[40px] w-full border border-onboarding-border-100 pr-12 placeholder:text-onboarding-text-400"
                      id="company_name"
                      name="company_name"
                      type="text"
                      placeholder="Plane"
                      value={instanceFormData.company_name}
                      onChange={(e) => handleFormChange("company_name", e.target.value)}
                    />
                  </div>

                  {/* Password */}
                  <div className="w-full space-y-2">
                    <div className="text-sm text-custom-text-300 font-medium">
                      Create password <span className="text-red-500">*</span>
                    </div>
                    <div className="relative flex items-center rounded-md">
                      <Input
                        className="h-[40px] w-full border border-onboarding-border-100 pr-12 placeholder:text-onboarding-text-400"
                        id="password"
                        name="password"
                        type={revealPassword ? "text" : "password"}
                        placeholder="Set a strong password"
                        value={instanceFormData.password}
                        onChange={(e) => handleFormChange("password", e.target.value)}
                        minLength={8}
                        required
                      />
                      {revealPassword ? (
                        <EyeOff
                          className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                          onClick={() => setRevealPassword(false)}
                        />
                      ) : (
                        <Eye
                          className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                          onClick={() => setRevealPassword(true)}
                        />
                      )}
                    </div>
                  </div>

                  {/* telemetry enable/disabled */}
                  <div className="pt-4">
                    <div
                      className="relative flex items-center gap-2 cursor-pointer"
                      onClick={() => handleFormChange("is_telemetry_enabled", !instanceFormData.is_telemetry_enabled)}
                    >
                      <div
                        className={`flex-shrink-0 w-4 h-4 rounded relative flex justify-center items-center border-[1.5px] ${
                          instanceFormData.is_telemetry_enabled
                            ? `text-white bg-custom-primary-100 border-custom-primary-100`
                            : `border-onboarding-border-100`
                        }`}
                      >
                        {instanceFormData.is_telemetry_enabled && <CheckIcon className="w-3.5 h-3.5" />}
                      </div>
                      <div className="font-medium text-sm">Allow Plane to collect anonymous usage events</div>
                    </div>

                    <div className="text-sm pt-4 text-custom-text-300 font-medium space-y-2">
                      <div>We collect usage events to analyse and improve Plane.</div>
                      <div className="space-y-1">
                        <div className="relative flex items-center gap-1.5">
                          <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full border border-onboarding-border-100 bg-onboarding-border-100" />
                          Plane never collects anything sensitive about you or your data.
                        </div>
                        <div className="relative flex items-center gap-1.5">
                          <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full border border-onboarding-border-100 bg-onboarding-border-100" />
                          All collection is completely anonymous.
                        </div>
                        <div className="relative flex items-center gap-1.5">
                          <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full border border-onboarding-border-100 bg-onboarding-border-100" />
                          Collection can be turned off at any point in your instance settings.
                        </div>
                      </div>
                      <div className="pt-2 text-custom-primary-100 cursor-pointer">
                        Know more about what we track here.
                      </div>
                    </div>
                  </div>

                  {/* submit buttons */}
                  <div className="py-3">
                    <Button type="submit" className="w-full">
                      Continue
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
