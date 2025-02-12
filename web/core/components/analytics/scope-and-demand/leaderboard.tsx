// plane ui
import { useTranslation } from "@plane/i18n";
import { Card } from "@plane/ui";
// components
import { ProfileEmptyState } from "@/components/ui";
// helpers
import { getFileURL } from "@/helpers/file.helper";
// image
import emptyUsers from "@/public/empty-state/empty_users.svg";

type Props = {
  users: {
    avatar_url: string | null;
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

export const AnalyticsLeaderBoard: React.FC<Props> = ({ users, title, emptyStateMessage, workspaceSlug }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <h6 className="text-base font-medium">{title}</h6>
      {users.length > 0 ? (
        <div className="mt-3 space-y-3">
          {users.map((user) => (
            <a
              key={user?.display_name ?? "None"}
              href={`/${workspaceSlug}/profile/${user.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-2">
                {user.avatar_url && user.avatar_url !== "" ? (
                  <div className="relative h-4 w-4 flex-shrink-0 rounded-full">
                    <img
                      src={getFileURL(user.avatar_url)}
                      className="absolute left-0 top-0 h-full w-full rounded-full object-cover"
                      alt={user?.display_name ?? "None"}
                    />
                  </div>
                ) : (
                  <div className="grid h-4 w-4 flex-shrink-0 place-items-center rounded-full bg-gray-700 text-[11px] capitalize text-white">
                    {user?.display_name !== "" ? user?.display_name?.[0] : "?"}
                  </div>
                )}
                <span className="break-words text-custom-text-200">
                  {user?.display_name !== "" ? `${user?.display_name}` : "No assignee"}
                </span>
              </div>
              <span className="flex-shrink-0">{user.count}</span>
            </a>
          ))}
        </div>
      ) : (
        <div className="px-7 py-4">
          <ProfileEmptyState title={t("no_data_yet")} description={emptyStateMessage} image={emptyUsers} />
        </div>
      )}
    </Card>
  );
};
