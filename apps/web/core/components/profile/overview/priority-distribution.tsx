// plane imports
import { useTranslation } from "@plane/i18n";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { IUserProfileData } from "@plane/types";
import { Loader, Card } from "@plane/ui";
import { capitalizeFirstLetter } from "@plane/utils";

type Props = {
  userProfile: IUserProfileData | undefined;
};

const priorityColors = {
  urgent: "#991b1b",
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#16a34a",
  none: "#e5e5e5",
};

export function ProfilePriorityDistribution({ userProfile }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col space-y-2">
      <h3 className="text-16 font-medium">{t("profile.stats.priority_distribution.title")}</h3>
      {userProfile ? (
        <Card>
          {userProfile.priority_distribution.length > 0 ? (
            <BarChart
              className="w-full h-[300px]"
              margin={{ top: 20, right: 30, bottom: 5, left: 0 }}
              data={userProfile.priority_distribution.map((priority) => ({
                key: priority.priority ?? "None",
                name: capitalizeFirstLetter(priority.priority ?? "None"),
                count: priority.priority_count,
              }))}
              bars={[
                {
                  key: "count",
                  label: "Count",
                  stackId: "bar-one",
                  fill: (payload: any) => priorityColors[payload.key as keyof typeof priorityColors], // TODO: fix types
                  textClassName: "",
                  showPercentage: false,
                  showTopBorderRadius: () => true,
                  showBottomBorderRadius: () => true,
                },
              ]}
              xAxis={{
                key: "name",
                label: t("profile.stats.priority_distribution.priority"),
              }}
              yAxis={{
                key: "count",
                label: "",
              }}
              barSize={20}
            />
          ) : (
            <EmptyStateCompact
              assetKey="priority"
              assetClassName="size-20"
              title={t("workspace_empty_state.your_work_by_priority.title")}
            />
          )}
        </Card>
      ) : (
        <div className="grid place-items-center p-7">
          <Loader className="flex items-end gap-12">
            <Loader.Item width="30px" height="200px" />
            <Loader.Item width="30px" height="150px" />
            <Loader.Item width="30px" height="250px" />
            <Loader.Item width="30px" height="150px" />
            <Loader.Item width="30px" height="100px" />
          </Loader>
        </div>
      )}
    </div>
  );
}
