import Image from "next/image";
import { useTheme } from "next-themes";
// assets
import DarkImage from "public/empty-state/dashboard/dark/issues-by-state-group.svg";
import LightImage from "public/empty-state/dashboard/light/issues-by-state-group.svg";

export const IssuesByStateGroupEmptyState = () => {
  // next-themes
  const { resolvedTheme } = useTheme();

  const image = resolvedTheme === "dark" ? DarkImage : LightImage;

  return (
    <div className="text-center space-y-6 flex flex-col items-center">
      <div className="h-24 w-24">
        <Image src={image} className="w-full h-full" alt="Issues by state group" />
      </div>
      <p className="text-sm font-medium text-custom-text-300">
        Issue assigned to you, broken down by state,
        <br />
        will show up here.
      </p>
    </div>
  );
};
