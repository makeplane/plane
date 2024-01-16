import Image from "next/image";
import { useTheme } from "next-themes";
// helpers
import { cn } from "helpers/common.helper";
// types
import { TDurationFilterOptions, TIssuesListTypes } from "@plane/types";
// constants
import { ASSIGNED_ISSUES_EMPTY_STATES } from "constants/dashboard";

type Props = {
  filter: TDurationFilterOptions;
  type: TIssuesListTypes;
};

export const AssignedIssuesEmptyState: React.FC<Props> = (props) => {
  const { filter, type } = props;
  // next-themes
  const { resolvedTheme } = useTheme();

  const typeDetails = ASSIGNED_ISSUES_EMPTY_STATES[type];

  const image = resolvedTheme === "dark" ? typeDetails.darkImage : typeDetails.lightImage;

  return (
    <div className="text-center space-y-10 mt-16 flex flex-col items-center">
      <p className="text-sm font-medium text-custom-text-300">{typeDetails.title(filter)}</p>
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
        <Image src={image} className="w-full h-full" alt="Assigned issues" />
      </div>
    </div>
  );
};
