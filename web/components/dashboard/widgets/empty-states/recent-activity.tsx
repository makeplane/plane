import Image from "next/image";
import { useTheme } from "next-themes";
// assets
import DarkImage from "public/empty-state/dashboard/dark/recent-activity.svg";
import LightImage from "public/empty-state/dashboard/light/recent-activity.svg";
// helpers
import { cn } from "helpers/common.helper";

type Props = {};

export const RecentActivityEmptyState: React.FC<Props> = (props) => {
  const {} = props;
  // next-themes
  const { resolvedTheme } = useTheme();

  return (
    <div className="text-center space-y-10 mt-16 flex flex-col items-center">
      <p className="text-sm font-medium text-custom-text-300">
        Feels new, go and explore our tool in depth and come back
        <br />
        to see your activity.
      </p>
      <div
        className={cn("w-3/5 h-1/3 p-1.5 pb-0 rounded-t-md", {
          "border border-custom-border-200": resolvedTheme === "dark",
        })}
        style={{
          background:
            resolvedTheme === "light"
              ? "linear-gradient(135deg, rgba(235, 243, 255, 0.45) 3.57%, rgba(99, 161, 255, 0.24) 94.16%)"
              : "",
        }}
      >
        <Image
          src={resolvedTheme === "dark" ? DarkImage : LightImage}
          className="w-full h-full"
          alt="Issues by priority"
        />
      </div>
    </div>
  );
};
