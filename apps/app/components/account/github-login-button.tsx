import { useEffect, useState, FC } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
// images
import githubImage from "/public/logos/github.png";

const { NEXT_PUBLIC_GITHUB_ID } = process.env;

export interface GithubLoginButtonProps {
  handleSignIn: React.Dispatch<string>;
}

export const GithubLoginButton: FC<GithubLoginButtonProps> = (props) => {
  const { handleSignIn } = props;
  // router
  const {
    query: { code },
  } = useRouter();
  // states
  const [loginCallBackURL, setLoginCallBackURL] = useState(undefined);

  useEffect(() => {
    if (code) {
      handleSignIn(code.toString());
    }
  }, [code, handleSignIn]);

  useEffect(() => {
    const origin =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    setLoginCallBackURL(`${origin}/signin` as any);
  }, []);

  return (
    <Link
      href={`https://github.com/login/oauth/authorize?client_id=${NEXT_PUBLIC_GITHUB_ID}&redirect_uri=${loginCallBackURL}&scope=read:user,user:email`}
    >
      <button className="flex w-full items-center rounded bg-black px-3 py-2 text-sm text-white opacity-90 duration-300 hover:opacity-100">
        <Image
          src={githubImage}
          height={25}
          width={25}
          className="flex-shrink-0"
          alt="GitHub Logo"
        />
        <span className="w-full text-center font-medium">Continue with GitHub</span>
      </button>
    </Link>
  );
};
