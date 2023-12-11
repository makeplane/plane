import useSWR from "swr";

import { observer } from "mobx-react-lite";
// services
import { AuthService } from "services/authentication.service";
import { AppConfigService } from "services/app-config.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { GitHubSignInButton, GoogleSignInButton } from "components/accounts";

type Props = {
  handleSignInRedirection: () => Promise<void>;
};

// services
const authService = new AuthService();
const appConfig = new AppConfigService();

export const OAuthOptions: React.FC<Props> = observer((props) => {
  const { handleSignInRedirection } = props;
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

        if (response) handleSignInRedirection();
      } else throw Error("Cant find credentials");
    } catch (err: any) {
      setToastAlert({
        title: "Error signing in!",
        type: "error",
        message: err?.error || "Something went wrong. Please try again later or contact the support team.",
      });
    }
  };

  const handleGitHubSignIn = async (credential: string) => {
    try {
      if (envConfig && envConfig.github_client_id && credential) {
        const socialAuthPayload = {
          medium: "github",
          credential,
          clientId: envConfig.github_client_id,
        };
        const response = await authService.socialAuth(socialAuthPayload);

        if (response) handleSignInRedirection();
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
      <div className="mx-auto mt-4 flex items-center sm:w-96">
        <hr className="w-full border-onboarding-border-100" />
        <p className="mx-3 flex-shrink-0 text-center text-sm text-onboarding-text-400">Or continue with</p>
        <hr className="w-full border-onboarding-border-100" />
      </div>
      <div className="mx-auto space-y-4 overflow-hidden pt-7 sm:w-96">
        {envConfig?.google_client_id && (
          <GoogleSignInButton clientId={envConfig?.google_client_id} handleSignIn={handleGoogleSignIn} />
        )}
        {envConfig?.github_client_id && (
          <GitHubSignInButton clientId={envConfig?.github_client_id} handleSignIn={handleGitHubSignIn} />
        )}
      </div>
    </>
  );
});
