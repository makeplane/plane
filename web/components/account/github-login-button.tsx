import { useEffect, useState, FC } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
// images
import githubBlackImage from "/public/logos/github-black.png";
import githubWhiteImage from "/public/logos/github-white.png";

export interface GithubLoginButtonProps {
  handleSignIn: React.Dispatch<string>;
  clientId: string;
}

export const GithubLoginButton: FC<GithubLoginButtonProps> = (props) => {
  const { handleSignIn, clientId } = props;
  // states
  const [loginCallBackURL, setLoginCallBackURL] = useState(undefined);
  const [gitCode, setGitCode] = useState<null | string>(null);
  // router
  const {
    query: { code },
  } = useRouter();
  // theme
  const { theme } = useTheme();

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
    <div className="w-full flex justify-center items-center">
      <Link
        href={`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${loginCallBackURL}&scope=read:user,user:email`}
      >
        <button className="flex w-full items-center justify-center gap-2 rounded border border-custom-border-300 p-2 text-sm font-medium text-custom-text-100 duration-300 hover:bg-custom-background-80 h-[46px]">
          <Image
            src={theme === "dark" ? githubWhiteImage : githubBlackImage}
            height={20}
            width={20}
            alt="GitHub Logo"
          />
          <span>Sign in with GitHub</span>
        </button>
      </Link>
    </div>
  );
};
