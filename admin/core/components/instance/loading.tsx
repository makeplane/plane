import Image from "next/image";
import { useTheme } from "next-themes";
// assets
import LogoSpinnerDark from "@/public/images/logo-spinner-dark.gif";
import LogoSpinnerLight from "@/public/images/logo-spinner-light.gif";

export const InstanceLoading = () => {
  const { resolvedTheme } = useTheme();
  const logoSrc = resolvedTheme === "dark" ? LogoSpinnerDark : LogoSpinnerLight;

  return (
    <div className="h-full w-full relative container px-5 mx-auto flex justify-center items-center">
      <div className="w-auto max-w-2xl relative space-y-8 py-10">
        <div className="relative flex flex-col justify-center items-center space-y-4">
          <Image src={logoSrc} alt="logo" className="w-[82px] h-[82px] mr-2" priority={false} />
          <h3 className="font-medium text-2xl text-white ">Fetching instance details...</h3>
        </div>
      </div>
    </div>
  );
};
