import { useEffect, useState, FC } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
// images
import githubImage from "/public/logos/github-black.png";

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
    <div className="px-1 w-full">
      <Link
        href={`https://github.com/login/oauth/authorize?client_id=${NEXT_PUBLIC_GITHUB_ID}&redirect_uri=${loginCallBackURL}&scope=read:user,user:email`}
      >
        <button className="flex w-full items-center justify-center gap-3 rounded-md border border-brand-base p-2 text-sm font-medium text-gray-600 duration-300 hover:bg-gray-50">
          <Image src={githubImage} height={22} width={22} color="#000" alt="GitHub Logo" />
          <span>Sign In with Github</span>
        </button>
      </Link>
    </div>
  );
};
