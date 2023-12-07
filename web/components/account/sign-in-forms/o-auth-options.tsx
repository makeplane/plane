import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { AuthService } from "services/auth.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { GithubLoginButton, GoogleLoginButton } from "components/account";

type Props = {
  handleSignInRedirection: () => Promise<void>;
};

// services
const authService = new AuthService();

export const OAuthOptions: React.FC<Props> = observer((props) => {
  const { handleSignInRedirection } = props;
  // toast alert
  const { setToastAlert } = useToast();
  // mobx store
  const {
    appConfig: { envConfig },
  } = useMobxStore();

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
      <div className="flex sm:w-96 items-center mt-4 mx-auto">
        <hr className="border-onboarding-border-100 w-full" />
        <p className="text-center text-sm text-onboarding-text-400 mx-3 flex-shrink-0">Or continue with</p>
        <hr className="border-onboarding-border-100 w-full" />
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-2 pt-7 sm:w-96 mx-auto overflow-hidden">
        {envConfig?.google_client_id && (
          <GoogleLoginButton clientId={envConfig?.google_client_id} handleSignIn={handleGoogleSignIn} />
        )}
        {envConfig?.github_client_id && (
          <GithubLoginButton clientId={envConfig?.github_client_id} handleSignIn={handleGitHubSignIn} />
        )}
      </div>
    </>
  );
});
