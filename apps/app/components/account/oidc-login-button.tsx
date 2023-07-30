import { useEffect, useState, FC } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
// images
import userImage from "/public/user.png";
import { Loader, Spinner } from "components/ui";

export interface OidcLoginButtonProps {
  handleSignIn: React.Dispatch<string>;
}

export const OidcLoginButton: FC<OidcLoginButtonProps> = (props) => {
  const { handleSignIn } = props;
  // router
  const {
    push: routerPush,
    query: { code },
  } = useRouter();
  // states
  const [loginCallBackURL, setLoginCallBackURL] = useState(undefined);
  const [oidcCode, setOidcCode] = useState<null | string>(null);

  const oidcRedirect = `${process.env.NEXT_PUBLIC_OIDC_URL_AUTHORIZE}?client_id=${process.env.NEXT_PUBLIC_OIDC_CLIENT_ID}&redirect_uri=${loginCallBackURL}&scope=openid%20profile%20email&response_type=code`;

  useEffect(() => {
    if (code && !oidcCode) {
      setOidcCode(code.toString());
      handleSignIn(code.toString());
    }
    if (
      parseInt(process.env.NEXT_PUBLIC_AUTO_OIDC || "0") &&
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
      {parseInt(process.env.NEXT_PUBLIC_AUTO_OIDC || "0") || code ? (
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
