import Image from "next/image";
import { useTheme } from "next-themes";
import UpcomingIssuesDark from "@/public/empty-state/dashboard/dark/upcoming-issues.svg";
import UpcomingIssuesLight from "@/public/empty-state/dashboard/light/upcoming-issues.svg";

export const IssuesEmptyState = () => {
  // next-themes
  const { resolvedTheme } = useTheme();

  const image = resolvedTheme === "dark" ? UpcomingIssuesDark : UpcomingIssuesLight;

  // TODO: update empty state logic to use a general component
  return (
    <div className="text-center space-y-6 flex flex-col items-center justify-center">
      <div className="h-24 w-24">
        <Image src={image} className="w-full h-full" alt="Assigned issues" />
      </div>
      <p className="text-sm font-medium text-custom-text-300 whitespace-pre-line">No activity to display</p>
    </div>
  );
};
