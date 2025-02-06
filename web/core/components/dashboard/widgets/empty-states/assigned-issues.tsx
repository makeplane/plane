import Image from "next/image";
import { useTheme } from "next-themes";
import { TIssuesListTypes } from "@plane/types";
import CompletedIssuesDark from "@/public/empty-state/dashboard/dark/completed-issues.svg";
import OverdueIssuesDark from "@/public/empty-state/dashboard/dark/overdue-issues.svg";
import UpcomingIssuesDark from "@/public/empty-state/dashboard/dark/upcoming-issues.svg";
import CompletedIssuesLight from "@/public/empty-state/dashboard/light/completed-issues.svg";
import OverdueIssuesLight from "@/public/empty-state/dashboard/light/overdue-issues.svg";
import UpcomingIssuesLight from "@/public/empty-state/dashboard/light/upcoming-issues.svg";

export const ASSIGNED_ISSUES_EMPTY_STATES = {
  pending: {
    title: "Work items assigned to you that are pending\nwill show up here.",
    darkImage: UpcomingIssuesDark,
    lightImage: UpcomingIssuesLight,
  },
  upcoming: {
    title: "Upcoming work items assigned to\nyou will show up here.",
    darkImage: UpcomingIssuesDark,
    lightImage: UpcomingIssuesLight,
  },
  overdue: {
    title: "Work items assigned to you that are past\ntheir due date will show up here.",
    darkImage: OverdueIssuesDark,
    lightImage: OverdueIssuesLight,
  },
  completed: {
    title: "Work items assigned to you that you have\nmarked Completed will show up here.",
    darkImage: CompletedIssuesDark,
    lightImage: CompletedIssuesLight,
  },
};
type Props = {
  type: TIssuesListTypes;
};

export const AssignedIssuesEmptyState: React.FC<Props> = (props) => {
  const { type } = props;
  // next-themes
  const { resolvedTheme } = useTheme();

  const typeDetails = ASSIGNED_ISSUES_EMPTY_STATES[type];

  const image = resolvedTheme === "dark" ? typeDetails.darkImage : typeDetails.lightImage;

  // TODO: update empty state logic to use a general component
  return (
    <div className="text-center space-y-6 flex flex-col items-center">
      <div className="h-24 w-24">
        <Image src={image} className="w-full h-full" alt="Assigned work items" />
      </div>
      <p className="text-sm font-medium text-custom-text-300 whitespace-pre-line">{typeDetails.title}</p>
    </div>
  );
};
