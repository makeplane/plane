import { useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Lightbulb } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { AuthService } from "services/auth.service";
// components
import { InstanceAdminPasswordForm, InstanceAdminPasswordFormValues, InstanceEmailCodeForm } from "components/account";
// ui
import { Input, Spinner } from "@plane/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
import signInIssues from "public/onboarding/onboarding-issues.svg";
// types
import { InstanceSetupDone } from "components/instance/instance-setup-done";

const authService = new AuthService();

export const InstanceSetupView = observer(() => {
  // store
  const {
    user: { fetchCurrentUser },
  } = useMobxStore();
  // states
  const [isLoading, setLoading] = useState(false);
  const [instanceAdminPasswordForm, setInstanceAdminPasswordForm] = useState(false);
  const [showInstanceSetupDone, setShowInstanceSetupDone] = useState(false);
  const [instanceAdminEmail, setInstanceAdminEmail] = useState("");

  const { setToastAlert } = useToast();
  const { resolvedTheme } = useTheme();

  const mutateUserInfo = useCallback(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    mutateUserInfo();
  }, [mutateUserInfo]);

  const handlePasswordSignIn = (formData: InstanceAdminPasswordFormValues) => {
    setLoading(true);

    return authService
      .setAdminInstancePassword(formData)
      .then(() => {
        mutateUserInfo();
        setShowInstanceSetupDone(true);
      })
      .catch((err) => {
        setLoading(false);
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error || "Something went wrong. Please try again later or contact the support team.",
        });
      });
  };
  const handleEmailCodeSignIn = async (response: any) => {
    try {
      setLoading(true);
      if (response && response.is_password_autoset) {
        setInstanceAdminEmail(response.email);
        setInstanceAdminPasswordForm(true);
        setLoading(false);
      } else {
        setShowInstanceSetupDone(true);
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      setToastAlert({
        type: "error",
        title: "Error!",
        message: err?.error || "Something went wrong. Please try again later or contact the support team.",
      });
    }
  };

  if (showInstanceSetupDone) return <InstanceSetupDone />;

  return (
    <>
      {isLoading ? (
        <div className="grid place-items-center h-screen">
          <Spinner />
        </div>
      ) : (
        <div className={`bg-onboarding-gradient-100 h-full w-full`}>
          <div className="flex items-center justify-between sm:py-5 px-8 pb-4 sm:px-16 lg:px-28 ">
            <div className="flex gap-x-2 py-10 items-center">
              <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" className="mr-2" />
              <span className="font-semibold text-2xl sm:text-3xl">Plane</span>
            </div>
          </div>

          <div className="h-full bg-onboarding-gradient-100 md:w-2/3 sm:w-4/5 px-4 pt-4 rounded-t-md mx-auto shadow-sm border-x border-t border-custom-border-200 ">
            <div className={`px-7 sm:px-0 bg-onboarding-gradient-200 h-full pt-24 pb-56 rounded-t-md overflow-auto`}>
              <>
                <div className="sm:w-96 mx-auto flex flex-col divide-y divide-custom-border-200">
                  <div className="pb-2">
                    {instanceAdminPasswordForm ? (
                      <>
                        <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-custom-text-100">
                          Let’s secure your instance
                        </h1>
                        <div className="text-center text-sm text-onboarding-text-200 mt-3">
                          <p>Paste the code you got at </p>
                          <span className="text-center text-sm text-custom-primary-80 mt-1 font-semibold ">
                            {instanceAdminEmail}{" "}
                          </span>
                          <span className="text-onboarding-text-200">below.</span>
                        </div>

                        <div className="space-y-4 mt-10 w-full sm:w-[360px] mx-auto">
                          <div className="space-y-1">
                            <Input
                              id="email"
                              type="email"
                              name="email"
                              value={instanceAdminEmail}
                              disabled
                              placeholder="Enter your email address..."
                              className="border-custom-border-300 h-[46px] w-full"
                            />
                          </div>
                          <InstanceAdminPasswordForm onSubmit={handlePasswordSignIn} />
                        </div>
                      </>
                    ) : (
                      <InstanceEmailCodeForm handleSignIn={handleEmailCodeSignIn} />
                    )}
                  </div>
                </div>

                <div
                  className={`flex py-2 bg-onboarding-background-100 border border-onboarding-border-200 mx-auto rounded-[3.5px] sm:w-96 mt-16`}
                >
                  <Lightbulb className="h-7 w-7 mr-2 mx-3" />
                  <p className={`text-sm text-left text-onboarding-text-100`}>
                    Try the latest features, like Tiptap editor, to write compelling responses.{" "}
                    <span className="font-medium text-sm underline hover:cursor-pointer" onClick={() => {}}>
                      See new features
                    </span>
                  </p>
                </div>
                <div className="flex justify-center border border-onboarding-border-200 sm:w-96 sm:h-52 object-cover mt-8 mx-auto rounded-md bg-onboarding-background-100 ">
                  <Image
                    src={signInIssues}
                    alt="Plane Issues"
                    className={`flex object-cover rounded-md ${
                      resolvedTheme === "dark" ? "bg-onboarding-background-100" : "bg-custom-primary-70"
                    } `}
                  />
                </div>
              </>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
