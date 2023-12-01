import { observer } from "mobx-react-lite";

import useSWR from "swr";

// services
import UserService from "services/user.service";
import authService from "services/authentication.service";
import { AppConfigService } from "services/app-config.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { ESignInSteps, GoogleLoginButton } from "components/accounts";

type Props = {
  updateEmail: (email: string) => void;
  handleStepChange: (step: ESignInSteps) => void;
  handleSignInRedirection: () => Promise<void>;
};

// services
const userService = new UserService();
const appConfig = new AppConfigService();

export const OAuthOptions: React.FC<Props> = observer((props) => {
  const { updateEmail, handleStepChange, handleSignInRedirection } = props;
  // toast alert
  const { setToastAlert } = useToast();

  const { data: envConfig } = useSWR("APP_CONFIG", () => appConfig.envConfig());

  const handleGoogleSignIn = async ({ clientId, credential }: any) => {
    try {
      if (clientId && credential) {
        const socialAuthPayload = {
          medium: "google",
          credential,
          clientId,
        };
        const response = await authService.socialAuth(socialAuthPayload);

        if (response) {
          const currentUser = await userService.currentUser();

          updateEmail(currentUser.email);

          if (currentUser.is_password_autoset) handleStepChange(ESignInSteps.OPTIONAL_SET_PASSWORD);
          else handleSignInRedirection();
        }
      } else throw Error("Cant find credentials");
    } catch (err: any) {
      setToastAlert({
        title: "Error signing in!",
        type: "error",
        message: err?.error || "Something went wrong. Please try again later or contact the support team.",
      });
    }
  };

  return (
    <>
      <div className="flex sm:w-96 items-center mt-4 mx-auto">
        <hr className={`border-onboarding-border-100 w-full`} />
        <p className="text-center text-sm text-onboarding-text-400 mx-3 flex-shrink-0">Or continue with</p>
        <hr className={`border-onboarding-border-100 w-full`} />
      </div>
      <div className="flex flex-col items-center justify-center gap-4 pt-7 sm:flex-row sm:w-96 mx-auto overflow-hidden">
        {envConfig?.google_client_id && (
          <GoogleLoginButton clientId={envConfig?.google_client_id} handleSignIn={handleGoogleSignIn} />
        )}
      </div>
    </>
  );
});
