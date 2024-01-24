import Image from "next/image";
import { useTheme } from "next-themes";
// assets
import DarkImage from "public/empty-state/dashboard/dark/recent-activity.svg";
import LightImage from "public/empty-state/dashboard/light/recent-activity.svg";

export const RecentActivityEmptyState = () => {
  // next-themes
  const { resolvedTheme } = useTheme();

  const image = resolvedTheme === "dark" ? DarkImage : LightImage;

  return (
    <div className="text-center space-y-6 flex flex-col items-center">
      <div className="h-24 w-24">
        <Image src={image} className="w-full h-full" alt="Issues by state group" />
      </div>
      <p className="text-sm font-medium text-custom-text-300">
        All your issue activities across
        <br />
        projects will show up here.
      </p>
    </div>
  );
};
