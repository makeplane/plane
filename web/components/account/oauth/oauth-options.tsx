import { observer } from "mobx-react-lite";
// hooks
import { useApplication } from "hooks/store";
// components
import { GoogleOAuthButton, GithubOAuthButton } from "components/account";

export const OAuthOptions: React.FC = observer(() => {
  // mobx store
  const {
    config: { envConfig },
  } = useApplication();
  // derived values
  const areBothOAuthEnabled = envConfig?.google_client_id && envConfig?.github_client_id;

  return (
    <>
      <div className="mx-auto mt-4 flex items-center sm:w-96">
        <hr className="w-full border-onboarding-border-100" />
        <p className="mx-3 flex-shrink-0 text-center text-sm text-onboarding-text-400">Or continue with</p>
        <hr className="w-full border-onboarding-border-100" />
      </div>
      <div className={`mx-auto mt-7 grid gap-4 overflow-hidden sm:w-96 ${areBothOAuthEnabled ? "grid-cols-2" : ""}`}>
        {envConfig?.google_client_id && (
          <div className="flex h-[42px] items-center !overflow-hidden">
            <GoogleOAuthButton text="SignIn with Google" />
          </div>
        )}
        {envConfig?.github_client_id && <GithubOAuthButton text="SignIn with Github" />}
      </div>
    </>
  );
});
