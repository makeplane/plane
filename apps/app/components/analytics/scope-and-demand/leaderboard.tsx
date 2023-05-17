import Image from "next/image";

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
  <div className="p-3 border border-brand-base rounded-[10px]">
    <h6 className="text-base font-medium">{title}</h6>
    <div className="mt-3 space-y-3">
      {users.map((user) => (
        <div key={user.email ?? "None"} className="flex items-start justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            {user && user.avatar && user.avatar !== "" ? (
              <div className="rounded-full h-4 w-4 flex-shrink-0">
                <Image
                  src={user.avatar}
                  height="100%"
                  width="100%"
                  className="rounded-full"
                  alt={user.email ?? "None"}
                />
              </div>
            ) : (
              <div className="grid place-items-center flex-shrink-0 rounded-full bg-gray-700 text-[11px] capitalize text-white h-4 w-4">
                {user.firstName !== "" ? user.firstName[0] : "?"}
              </div>
            )}
            <span className="break-all text-brand-secondary">
              {user.firstName !== "" ? `${user.firstName} ${user.lastName}` : "No assignee"}
            </span>
          </div>
          <span className="flex-shrink-0">{user.count}</span>
        </div>
      ))}
    </div>
  </div>
);
