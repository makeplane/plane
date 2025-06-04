import { FC } from "react";
import { useTheme } from "next-themes";
// icons
import { Key } from "lucide-react";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";

export type OIDCOAuthButtonProps = {
  text: string;
};

export const OIDCOAuthButton: FC<OIDCOAuthButtonProps> = (props) => {
  const { text } = props;
  // hooks
  const { resolvedTheme } = useTheme();

  const handleSignIn = () => {
    window.location.assign(`${API_BASE_URL}/auth/oidc/`);
  };

  return (
    <button
      className={`flex h-[42px] w-full items-center justify-center gap-2 rounded border px-2 text-sm font-medium text-custom-text-100 duration-300 hover:bg-onboarding-background-300 ${
        resolvedTheme === "dark" ? "border-[#43484F] bg-[#2F3135]" : "border-[#D9E4FF]"
      }`}
      onClick={handleSignIn}
    >
      <Key height={16} width={16} />
      {text}
    </button>
  );
};
