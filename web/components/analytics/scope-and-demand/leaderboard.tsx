// ui
import { ProfileEmptyState } from "components/ui";
// image
import emptyUsers from "public/empty-state/empty_users.svg";

type Props = {
  users: {
    avatar: string | null;
    display_name: string | null;
    firstName: string;
    lastName: string;
    count: number;
    id: string;
  }[];
  title: string;
  emptyStateMessage: string;
  workspaceSlug: string;
};

export const AnalyticsLeaderBoard: React.FC<Props> = ({ users, title, emptyStateMessage, workspaceSlug }) => (
  <div className="p-3 border border-custom-border-200 rounded-[10px]">
    <h6 className="text-base font-medium">{title}</h6>
    {users.length > 0 ? (
      <div className="mt-3 space-y-3">
        {users.map((user) => (
          <a
            key={user.display_name ?? "None"}
            href={`/${workspaceSlug}/profile/${user.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start justify-between gap-4 text-xs"
          >
            <div className="flex items-center gap-2">
              {user && user.avatar && user.avatar !== "" ? (
                <div className="relative rounded-full h-4 w-4 flex-shrink-0">
                  <img
                    src={user.avatar}
                    className="absolute top-0 left-0 h-full w-full object-cover rounded-full"
                    alt={user.display_name ?? "None"}
                  />
                </div>
              ) : (
                <div className="grid place-items-center flex-shrink-0 rounded-full bg-gray-700 text-[11px] capitalize text-white h-4 w-4">
                  {user.display_name !== "" ? user?.display_name?.[0] : "?"}
                </div>
              )}
              <span className="break-words text-custom-text-200">
                {user.display_name !== "" ? `${user.display_name}` : "No assignee"}
              </span>
            </div>
            <span className="flex-shrink-0">{user.count}</span>
          </a>
        ))}
      </div>
    ) : (
      <div className="px-7 py-4">
        <ProfileEmptyState title="No Data yet" description={emptyStateMessage} image={emptyUsers} />
      </div>
    )}
  </div>
);
