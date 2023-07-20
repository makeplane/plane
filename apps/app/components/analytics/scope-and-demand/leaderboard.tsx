type Props = {
  users: {
    avatar: string | null;
    email: string | null;
    firstName: string;
    lastName: string;
    count: number;
  }[];
  title: string;
};

export const AnalyticsLeaderboard: React.FC<Props> = ({ users, title }) => (
  <div className="p-3 border border-custom-border-200 rounded-[10px]">
    <h6 className="text-base font-medium">{title}</h6>
    {users.length > 0 ? (
      <div className="mt-3 space-y-3">
        {users.map((user) => (
          <div
            key={user.email ?? "None"}
            className="flex items-start justify-between gap-4 text-xs"
          >
            <div className="flex items-center gap-2">
              {user && user.avatar && user.avatar !== "" ? (
                <div className="relative rounded-full h-4 w-4 flex-shrink-0">
                  <img
                    src={user.avatar}
                    className="absolute top-0 left-0 h-full w-full object-cover rounded-full"
                    alt={user.email ?? "None"}
                  />
                </div>
              ) : (
                <div className="grid place-items-center flex-shrink-0 rounded-full bg-gray-700 text-[11px] capitalize text-white h-4 w-4">
                  {user.firstName !== "" ? user.firstName[0] : "?"}
                </div>
              )}
              <span className="break-words text-custom-text-200">
                {user.firstName !== "" ? `${user.firstName} ${user.lastName}` : "No assignee"}
              </span>
            </div>
            <span className="flex-shrink-0">{user.count}</span>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-custom-text-200 text-center text-sm py-8">No matching data found.</div>
    )}
  </div>
);
