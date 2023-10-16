import Image from "next/image";
import { useRouter } from "next/router";

import useSWR from "swr";

// component
import { Icon } from "components/ui";
// services
import { WorkspaceService } from "services/workspace.service";
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

// services
const workspaceService = new WorkspaceService();

export const Avatar: React.FC<AvatarProps> = ({ user, index, height = "24px", width = "24px", fontSize = "12px" }) => (
  <div
    className={`relative rounded border-[0.5px] ${
      index && index !== 0 ? "-ml-3.5 border-custom-border-200" : "border-transparent"
    }`}
    style={{
      height: height,
      width: width,
    }}
  >
    {user && user.avatar && user.avatar !== "" ? (
      <div
        className={`rounded border-[0.5px] ${
          index ? "border-custom-border-200 bg-custom-background-100" : "border-transparent"
        }`}
        style={{
          height: height,
          width: width,
        }}
      >
        <img
          src={user.avatar}
          className="absolute top-0 left-0 h-full w-full object-cover rounded"
          alt={user.display_name}
        />
      </div>
    ) : (
      <div
        className="grid place-items-center text-xs capitalize text-white rounded bg-gray-700  border-[0.5px] border-custom-border-200"
        style={{
          height: height,
          width: width,
          fontSize: fontSize,
        }}
      >
        {user?.display_name?.charAt(0)}
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

export const AssigneesList: React.FC<AsigneesListProps> = ({ users, userIds, length = 3, showLength = true }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: people } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS(workspaceSlug as string) : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug as string) : null
  );

  if ((users && users.length === 0) || (userIds && userIds.length === 0))
    return (
      <div className="h-5 w-5 rounded border-[0.5px] border-custom-border-200 bg-custom-background-80">
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
          {users.length > length ? (
            <div className="-ml-3.5 relative h-6 w-6 rounded">
              <div className="flex items-center rounded bg-custom-background-80 text-xs capitalize h-6 w-6 text-custom-text-200 border-[0.5px] border-custom-border-300">
                <Icon iconName="add" className="text-xs !leading-3 -mr-0.5" />
                {users.length - length}
              </div>
            </div>
          ) : null}
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
              <div className="-ml-3.5 relative h-6 w-6 rounded">
                <div className="flex items-center rounded bg-custom-background-80 text-xs capitalize h-6 w-6 text-custom-text-200 border-[0.5px] border-custom-border-300">
                  <Icon iconName="add" className="text-xs !leading-3 -mr-0.5" />
                  {userIds.length - length}
                </div>
              </div>
            ) : null
          ) : (
            ""
          )}
        </>
      )}
    </>
  );
};
