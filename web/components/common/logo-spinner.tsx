import Image from "next/image";
import { useTheme } from "next-themes";
// assets
import LogoSpinnerDark from "@/public/images/logo-spinner-dark.gif";
import LogoSpinnerLight from "@/public/images/logo-spinner-light.gif";

export const LogoSpinner = () => {
  const { resolvedTheme } = useTheme();

  const logoSrc = resolvedTheme === "dark" ? LogoSpinnerDark : LogoSpinnerLight;

  return (
    <div className="flex items-center justify-center">
      <Image src={logoSrc} alt="logo" className="size-16 sm:size-20 mr-2" />
    </div>
  );
};
