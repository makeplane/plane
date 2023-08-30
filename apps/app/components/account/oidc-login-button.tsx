import { useEffect, useState, FC } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
// images
import userImage from "/public/user.png";
import { Loader, Spinner } from "components/ui";
import { IOidcSettings } from "types/oidc";

export interface OidcLoginButtonProps {
  handleSignIn: React.Dispatch<string>;
  oidcSettings: IOidcSettings;
}

export const OidcLoginButton: FC<OidcLoginButtonProps> = (props) => {
  const { handleSignIn, oidcSettings } = props;
  // router
  const {
    push: routerPush,
    query: { code },
  } = useRouter();
  // states
  const [loginCallBackURL, setLoginCallBackURL] = useState(undefined);
  const [oidcCode, setOidcCode] = useState<null | string>(null);

  const oidcRedirect = `${oidcSettings.url_authorize}?client_id=${oidcSettings.client_id}&redirect_uri=${loginCallBackURL}&scope=openid%20profile%20email&response_type=code`;

  useEffect(() => {
    if (code && !oidcCode) {
      setOidcCode(code.toString());
      handleSignIn(code.toString());
    }
    if (
      oidcSettings.auto &&
      (!code || !oidcCode) &&
      loginCallBackURL
    ) {
      routerPush(oidcRedirect);
    }
  }, [loginCallBackURL, code, oidcCode, handleSignIn]);

  useEffect(() => {
    const origin =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    setLoginCallBackURL(`${origin}/` as any);
  }, []);

  return (
    <div className="w-full flex justify-center items-center px-[3px]">
      {oidcSettings.auto || code ? (
        <Spinner />
      ) : (
        <Link href={oidcRedirect}>
          <button className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-200 p-2 text-sm font-medium text-gray-600 duration-300 hover:bg-gray-50">
            <Image src={userImage} height={22} width={22} color="#000" alt="OIDC Logo" />
            <span>Sign In with OIDC</span>
          </button>
        </Link>
      )}
    </div>
  );
};
