import { useEffect, useState, FC } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
// next-themes
import { useTheme } from "next-themes";
// images
import githubBlackImage from "public/logos/github-black.svg";
import githubWhiteImage from "public/logos/github-white.svg";

type Props = {
  handleSignIn: React.Dispatch<string>;
  clientId: string;
};

export const GitHubSignInButton: FC<Props> = (props) => {
  const { handleSignIn, clientId } = props;
  // states
  const [loginCallBackURL, setLoginCallBackURL] = useState(undefined);
  const [gitCode, setGitCode] = useState<null | string>(null);

  const router = useRouter();

  const { code } = router.query;

  const { theme } = useTheme();

  useEffect(() => {
    if (code && !gitCode) {
      setGitCode(code.toString());
      handleSignIn(code.toString());
    }
  }, [code, gitCode, handleSignIn]);

  useEffect(() => {
    const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    setLoginCallBackURL(`${origin}/` as any);
  }, []);

  return (
    <div className="w-full">
      <Link
        className="w-full"
        href={`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${loginCallBackURL}&scope=read:user,user:email`}
      >
        <button className="flex h-[46px] w-full items-center justify-center gap-2 rounded border border-custom-border-300 p-2 text-sm font-medium text-custom-text-100 duration-300 hover:bg-custom-background-80">
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
