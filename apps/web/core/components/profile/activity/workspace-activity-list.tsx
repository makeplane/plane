import { useEffect } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// services
import { USER_PROFILE_ACTIVITY } from "@/constants/fetch-keys";
import { UserService } from "@/services/user.service";
// components
import { ActivityList } from "./activity-list";
// fetch-keys

// services
const userService = new UserService();

type Props = {
  cursor: string;
  perPage: number;
  updateResultsCount: (count: number) => void;
  updateTotalPages: (count: number) => void;
};

export const WorkspaceActivityListPage: React.FC<Props> = (props) => {
  const { cursor, perPage, updateResultsCount, updateTotalPages } = props;
  // router
  const { workspaceSlug, userId } = useParams();

  const { data: userProfileActivity } = useSWR(
    workspaceSlug && userId
      ? USER_PROFILE_ACTIVITY(workspaceSlug.toString(), userId.toString(), {
          cursor,
        })
      : null,
    workspaceSlug && userId
      ? () =>
          userService.getUserProfileActivity(workspaceSlug.toString(), userId.toString(), {
            cursor,
            per_page: perPage,
          })
      : null
  );

  useEffect(() => {
    if (!userProfileActivity) return;

    updateTotalPages(userProfileActivity.total_pages);
    updateResultsCount(userProfileActivity.results.length);
  }, [updateResultsCount, updateTotalPages, userProfileActivity]);

  return <ActivityList activity={userProfileActivity} />;
};
