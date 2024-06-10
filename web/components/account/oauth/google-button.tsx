import { FC } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// images
import GoogleLogo from "/public/logos/google-logo.svg";

export type GoogleOAuthButtonProps = {
  text: string;
};

export const GoogleOAuthButton: FC<GoogleOAuthButtonProps> = (props) => {
  const searchParams = useSearchParams();
  const next_path = searchParams.get("next_path");
  const { text } = props;
  // hooks
  const { resolvedTheme } = useTheme();

  const handleSignIn = () => {
    window.location.assign(`${API_BASE_URL}/auth/google/${next_path ? `?next_path=${next_path}` : ``}`);
  };

  return (
    <button
      className={`flex h-[42px] w-full items-center justify-center gap-2 rounded border px-2 text-sm font-medium text-custom-text-100 duration-300 bg-onboarding-background-200 hover:bg-onboarding-background-300 ${
        resolvedTheme === "dark" ? "border-[#43484F]" : "border-[#D9E4FF]"
      }`}
      onClick={handleSignIn}
    >
      <Image src={GoogleLogo} height={18} width={18} alt="Google Logo" />
      {text}
    </button>
  );
};
