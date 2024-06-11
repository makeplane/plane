import Image from "next/image";
import { useTheme } from "next-themes";
// assets
import DarkImage1 from "public/empty-state/dashboard/dark/recent-collaborators-1.svg";
import DarkImage2 from "public/empty-state/dashboard/dark/recent-collaborators-2.svg";
import DarkImage3 from "public/empty-state/dashboard/dark/recent-collaborators-3.svg";
import LightImage1 from "public/empty-state/dashboard/light/recent-collaborators-1.svg";
import LightImage2 from "public/empty-state/dashboard/light/recent-collaborators-2.svg";
import LightImage3 from "public/empty-state/dashboard/light/recent-collaborators-3.svg";

export const RecentCollaboratorsEmptyState = () => {
  // next-themes
  const { resolvedTheme } = useTheme();

  const image1 = resolvedTheme === "dark" ? DarkImage1 : LightImage1;
  const image2 = resolvedTheme === "dark" ? DarkImage2 : LightImage2;
  const image3 = resolvedTheme === "dark" ? DarkImage3 : LightImage3;

  return (
    <div className="mt-7 mb-16 px-36 flex flex-col lg:flex-row items-center justify-between gap-x-24 gap-y-16">
      <p className="text-sm font-medium text-custom-text-300 lg:w-2/5 flex-shrink-0 text-center lg:text-left">
        Compare your activities with the top
        <br />
        seven in your project.
      </p>
      <div className="flex items-center justify-evenly gap-20 lg:w-3/5 flex-shrink-0">
        <div className="h-24 w-24 flex-shrink-0">
          <Image src={image1} className="w-full h-full" alt="Recent collaborators" />
        </div>
        <div className="h-24 w-24 flex-shrink-0">
          <Image src={image2} className="w-full h-full" alt="Recent collaborators" />
        </div>
        <div className="h-24 w-24 flex-shrink-0 hidden xl:block">
          <Image src={image3} className="w-full h-full" alt="Recent collaborators" />
        </div>
      </div>
    </div>
  );
};
