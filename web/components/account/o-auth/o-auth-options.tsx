import { observer } from "mobx-react-lite";
// services
import { AuthService } from "services/auth.service";
// hooks
import { useApplication } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { GitHubSignInButton, GoogleSignInButton } from "components/account";

type Props = {
  handleSignInRedirection: () => Promise<void>;
  type: "sign_in" | "sign_up";
};

// services
const authService = new AuthService();

export const OAuthOptions: React.FC<Props> = observer((props) => {
  const { handleSignInRedirection, type } = props;
  // toast alert
  const { setToastAlert } = useToast();
  // mobx store
  const {
    config: { envConfig },
  } = useApplication();
  // derived values
  const areBothOAuthEnabled = envConfig?.google_client_id && envConfig?.github_client_id;

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
      <div className={`mx-auto mt-7 grid gap-4 overflow-hidden sm:w-96 ${areBothOAuthEnabled ? "grid-cols-2" : ""}`}>
        {envConfig?.google_client_id && (
          <div className="h-[42px] flex items-center !overflow-hidden">
            <GoogleSignInButton clientId={envConfig?.google_client_id} handleSignIn={handleGoogleSignIn} type={type} />
          </div>
        )}
        {envConfig?.github_client_id && (
          <GitHubSignInButton clientId={envConfig?.github_client_id} handleSignIn={handleGitHubSignIn} type={type} />
        )}
      </div>
    </>
  );
});
