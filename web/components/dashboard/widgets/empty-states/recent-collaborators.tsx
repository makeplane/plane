import Image from "next/image";
import { useTheme } from "next-themes";
// assets
import DarkImage from "public/empty-state/dashboard/dark/recent-collaborators.svg";
import LightImage from "public/empty-state/dashboard/light/recent-collaborators.svg";
// helpers
import { cn } from "helpers/common.helper";

type Props = {};

export const RecentCollaboratorsEmptyState: React.FC<Props> = (props) => {
  const {} = props;
  // next-themes
  const { resolvedTheme } = useTheme();

  return (
    <div className="mt-7 px-7 flex justify-between gap-16">
      <p className="text-sm font-medium text-custom-text-300">
        People are excited to work with you, once they do you will find your frequent collaborators here.
      </p>
      <div
        className={cn("w-3/5 h-1/3 p-1.5 pb-0 rounded-t-md flex-shrink-0 self-end", {
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
          alt="Recent collaborators"
        />
      </div>
    </div>
  );
};
