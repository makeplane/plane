import Image from "next/image";
import { useTheme } from "next-themes";
// assets
import DarkImage from "public/empty-state/dashboard/dark/issues-by-priority.svg";
import LightImage from "public/empty-state/dashboard/light/issues-by-priority.svg";
// helpers
import { cn } from "helpers/common.helper";
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// types
import { TDurationFilterOptions } from "@plane/types";

type Props = {
  filter: TDurationFilterOptions;
};

export const IssuesByPriorityEmptyState: React.FC<Props> = (props) => {
  const { filter } = props;
  // next-themes
  const { resolvedTheme } = useTheme();

  return (
    <div className="text-center space-y-10 mt-16 flex flex-col items-center">
      <p className="text-sm font-medium text-custom-text-300">
        No assigned issues {replaceUnderscoreIfSnakeCase(filter)}.
      </p>
      <div
        className={cn("w-1/2 h-1/3 p-1.5 pb-0 rounded-t-md", {
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
