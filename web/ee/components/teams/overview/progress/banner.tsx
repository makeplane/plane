import { observer } from "mobx-react";
import { CalendarClock, Loader as Spinner } from "lucide-react";
// plane imports
import { Loader, Logo } from "@plane/ui";
// plane web imports
import { cn } from "@plane/utils";
import { useTeams } from "@/plane-web/hooks/store";
import { useTeamAnalytics } from "@/plane-web/hooks/store/teams/use-team-analytics";

type TTeamProgressBannerProps = {
  teamId: string;
};

export const TeamProgressBanner: React.FC<TTeamProgressBannerProps> = observer((props) => {
  const { teamId } = props;
  // store hooks
  const { getTeamEntitiesLoaderById } = useTeams();
  const { getTeamProgressSummaryLoader, getTeamProgressSummary } = useTeamAnalytics();
  // derived values
  const teamEntitiesLoader = getTeamEntitiesLoaderById(teamId);
  const teamProgressSummaryLoader = getTeamProgressSummaryLoader(teamId);
  const teamProgressSummary = getTeamProgressSummary(teamId);
  const isLoading = teamEntitiesLoader === "init-loader" || teamProgressSummaryLoader === "init-loader";
  const isUpdating = teamProgressSummaryLoader === "mutation";
  const areIssuesOverdue = teamProgressSummary && teamProgressSummary.overdue_issues > 0;

  if (!isLoading && !areIssuesOverdue) return null;
  return (
    <div className="w-full h-full pt-1 pb-2.5">
      {isLoading ? (
        <Loader className="w-full h-8">
          <Loader.Item width="100%" height="100%" />
        </Loader>
      ) : (
        <div
          className={cn(
            "flex w-full h-8 py-0.5 px-4 items-center justify-between gap-2 text-sm font-medium rounded-lg",
            {
              "text-red-500 bg-red-500/15": areIssuesOverdue,
              "text-green-600 bg-green-500/15": !areIssuesOverdue,
            }
          )}
        >
          <div className="flex items-center gap-1.5">
            {areIssuesOverdue ? (
              <CalendarClock className="size-4 flex-shrink-0" />
            ) : (
              <Logo
                logo={{
                  emoji: {
                    url: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f60d.png",
                    value: "128525",
                  },
                  in_use: "emoji",
                }}
                size={16}
              />
            )}
            {areIssuesOverdue ? `${teamProgressSummary.overdue_issues} issues are overdue` : "You are doing great!!"}
            {areIssuesOverdue && (
              <Logo
                logo={{
                  emoji: {
                    url: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f615.png",
                    value: "128533",
                  },
                  in_use: "emoji",
                }}
                size={16}
              />
            )}
          </div>
          {isUpdating && <Spinner size={14} className="animate-spin flex-shrink-0 mx-1" />}
        </div>
      )}
    </div>
  );
});
