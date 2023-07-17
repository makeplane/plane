import Image from "next/image";
import { useRouter } from "next/router";

import useSWR from "swr";

// services
import workspaceService from "services/workspace.service";
// icons
import User from "public/user.png";
// types
import { IUser, IUserLite } from "types";
// fetch-keys
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";

type AvatarProps = {
  user?: Partial<IUser> | Partial<IUserLite> | null;
  index?: number;
  height?: string;
  width?: string;
  fontSize?: string;
};

export const Avatar: React.FC<AvatarProps> = ({
  user,
  index,
  height = "20px",
  width = "20px",
  fontSize = "12px",
}) => (
  <div
    className={`relative rounded-full ${index && index !== 0 ? "-ml-3.5" : ""}`}
    style={{
      height: height,
      width: width,
    }}
  >
    {user && user.avatar && user.avatar !== "" ? (
      <div
        className={`rounded-full border-2 ${
          index ? "border-custom-border-300 bg-custom-background-80" : "border-transparent"
        }`}
        style={{
          height: height,
          width: width,
        }}
      >
        <img
          src={user.avatar}
          className="absolute top-0 left-0 h-full w-full object-cover rounded-full"
          alt={user.first_name}
        />
      </div>
    ) : (
      <div
        className="grid place-items-center rounded-full border-2 border-custom-border-300 bg-gray-700 text-xs capitalize text-white"
        style={{
          height: height,
          width: width,
          fontSize: fontSize,
        }}
      >
        {user?.first_name && user.first_name !== ""
          ? user.first_name.charAt(0)
          : user?.email?.charAt(0)}
      </div>
    )}
  </div>
);

type AsigneesListProps = {
  users?: Partial<IUser[]> | (Partial<IUserLite> | undefined)[] | Partial<IUserLite>[];
  userIds?: string[];
  length?: number;
  showLength?: boolean;
};

export const AssigneesList: React.FC<AsigneesListProps> = ({
  users,
  userIds,
  length = 5,
  showLength = true,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: people } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS(workspaceSlug as string) : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug as string) : null
  );

  if ((users && users.length === 0) || (userIds && userIds.length === 0))
    return (
      <div className="h-5 w-5 rounded-full border-2 border-white bg-custom-background-80">
        <Image src={User} height="100%" width="100%" className="rounded-full" alt="No user" />
      </div>
    );

  return (
    <>
      {users && (
        <>
          {users.slice(0, length).map((user, index) => (
            <Avatar key={user?.id} user={user} index={index} />
          ))}
          {users.length > length ? <span>+{users.length - length}</span> : null}
        </>
      )}
      {userIds && (
        <>
          {userIds.slice(0, length).map((userId, index) => {
            const user = people?.find((p) => p.member.id === userId)?.member;

            return <Avatar key={userId} user={user} index={index} />;
          })}
          {showLength ? (
            userIds.length > length ? (
              <span>+{userIds.length - length}</span>
            ) : null
          ) : (
            ""
          )}
        </>
      )}
    </>
  );
};
