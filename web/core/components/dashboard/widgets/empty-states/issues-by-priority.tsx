import Image from "next/image";
import { useTheme } from "next-themes";
// assets
import DarkImage from "public/empty-state/dashboard/dark/issues-by-priority.svg";
import LightImage from "public/empty-state/dashboard/light/issues-by-priority.svg";

export const IssuesByPriorityEmptyState = () => {
  // next-themes
  const { resolvedTheme } = useTheme();

  const image = resolvedTheme === "dark" ? DarkImage : LightImage;

  return (
    <div className="text-center space-y-6 flex flex-col items-center">
      <div className="h-24 w-24">
        <Image src={image} className="w-full h-full" alt="Issues by state group" />
      </div>
      <p className="text-sm font-medium text-custom-text-300">
        Issues assigned to you, broken down by
        <br />
        priority will show up here.
      </p>
    </div>
  );
};
