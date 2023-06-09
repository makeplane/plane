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
  const [gitCode, setGitCode] = useState<null | string>(null);

  useEffect(() => {
    if (code && !gitCode) {
      setGitCode(code.toString());
      handleSignIn(code.toString());
    }
  }, [code, gitCode, handleSignIn]);

  useEffect(() => {
    const origin =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    setLoginCallBackURL(`${origin}/` as any);
  }, []);

  return (
    <div className="w-full px-1">
      <Link
        href={`https://github.com/login/oauth/authorize?client_id=${NEXT_PUBLIC_GITHUB_ID}&redirect_uri=${loginCallBackURL}&scope=read:user,user:email`}
      >
        <button className="flex w-full items-center justify-center gap-3 rounded-md border border-brand-base p-2 text-sm font-medium text-brand-secondary duration-300 hover:bg-brand-surface-2">
          <Image src={githubImage} height={22} width={22} color="#000" alt="GitHub Logo" />
          <span>Sign In with Github</span>
        </button>
      </Link>
    </div>
  );
};
