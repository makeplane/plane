import { useEffect, useState, FC } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
// images
import userImage from "/public/user.png";
import { Spinner } from "@plane/ui";
import { useTheme } from "next-themes";
import useToast from "hooks/use-toast";
import { AuthService } from "services/auth.service";

export interface OidcSignInButtonProps {
  handleSignInRedirection: () => Promise<void>;
  autoRedirect: boolean;
  clientId: string;
  authUrl: string;
}

// services
const authService = new AuthService();

export const OidcSignInButton: FC<OidcSignInButtonProps> = (props) => {
  const { handleSignInRedirection, autoRedirect, clientId, authUrl } = props;
  // router
  const {
    push: routerPush,
    query: { code },
  } = useRouter();
  // states
  const [loginCallBackURL, setSignInCallBackURL] = useState<null | string>(null);
  const [oidcCode, setOidcCode] = useState<null | string>(null);
  const [initialSignInError, setInitialSignInError] = useState<boolean>(false);
  // theme
  const { resolvedTheme } = useTheme();
  // toast alert
  const { setToastAlert } = useToast();

  const handleOidcSignIn = async (credential: string) => {
    try {
      if (clientId && credential) {
        const oidcAuthPayload = {
          credential,
          clientId,
        };
        const response = await authService.oidcAuth(oidcAuthPayload);

        if (response) handleSignInRedirection();
      } else throw Error("Cant find credentials");
    } catch (err: any) {
      setOidcCode(null);
      setInitialSignInError(true);
      setToastAlert({
        title: "Error signing in!",
        type: "error",
        message: err?.error || "Something went wrong. Please try again later or contact the support team.",
      });
    }
  };

  const oidcRedirect = `${authUrl}?client_id=${clientId}&redirect_uri=${loginCallBackURL}&scope=openid%20profile%20email&response_type=code`;

  useEffect(() => {
    if (code && !oidcCode) {
      setOidcCode(code.toString());
      handleOidcSignIn(code.toString());
    }
    if (autoRedirect && (!code || !oidcCode) && loginCallBackURL && !initialSignInError) {
      routerPush(oidcRedirect);
    }
  }, [loginCallBackURL, code, oidcCode, autoRedirect, oidcRedirect, initialSignInError]);

  useEffect(() => {
    const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    setSignInCallBackURL(`${origin}/`);
  }, []);

  return (
    <div className="w-full">
      <Link href={oidcRedirect}>
        <button
          className={`flex h-[42px] w-full items-center justify-center gap-2 rounded border px-2 text-sm font-medium text-custom-text-100 duration-300 hover:bg-onboarding-background-300 ${
            resolvedTheme === "dark" ? "border-[#43484F] bg-[#2F3135]" : "border-[#D9E4FF]"
          }`}
        >
          {(autoRedirect && !initialSignInError) || code ? (
            <Spinner />
          ) : (
            <>
              <Image src={userImage} height={22} width={22} color="#000" alt="OIDC" />
              <span className="text-onboarding-text-200">Sign In with OIDC</span>
            </>
          )}
        </button>
      </Link>
    </div>
  );
};
