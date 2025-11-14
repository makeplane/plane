import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Link } from "react-router";
// plane imports
import { ROLE } from "@plane/constants";
import { Popover } from "@plane/propel/popover";
import { Avatar } from "@plane/ui";
import { cn, getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUser } from "@/hooks/store/user";

type Props = {
  id: string;
};

export const EditorUserMention: React.FC<Props> = observer((props) => {
  const { id } = props;
  // router
  const { projectId } = useParams();
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { data: currentUser } = useUser();
  const {
    getUserDetails,
    project: { getProjectMemberDetails },
  } = useMember();
  // derived values
  const userDetails = getUserDetails(id);
  const roleDetails = projectId ? getProjectMemberDetails(id, projectId.toString())?.role : null;
  const profileLink = `/${workspaceSlug}/profile/${id}`;

  if (!userDetails) {
    return (
      <div className="not-prose inline px-1 py-0.5 rounded bg-custom-background-80 text-custom-text-300 no-underline">
        @suspended user
      </div>
    );
  }

  return (
    <div
      className={cn(
        "not-prose inline px-1 py-0.5 rounded bg-custom-primary-100/20 text-custom-primary-100 no-underline",
        {
          "bg-yellow-500/20 text-yellow-500": id === currentUser?.id,
        }
      )}
    >
      <Popover delay={100} openOnHover>
        <Popover.Button>
          <Link to={profileLink}>@{userDetails?.display_name}</Link>
        </Popover.Button>
        <Popover.Panel side="bottom" align="start">
          <div className="w-60 bg-custom-background-100 shadow-custom-shadow-rg rounded-lg p-3 border-[0.5px] border-custom-border-300">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 size-10 grid place-items-center">
                <Avatar
                  src={getFileURL(userDetails?.avatar_url ?? "")}
                  name={userDetails?.display_name}
                  size={40}
                  className="text-xl"
                  showTooltip={false}
                />
              </div>
              <div>
                <Link to={profileLink} className="not-prose font-medium text-custom-text-100 text-sm hover:underline">
                  {userDetails?.first_name} {userDetails?.last_name}
                </Link>
                {roleDetails && <p className="text-custom-text-200 text-xs">{ROLE[roleDetails]}</p>}
              </div>
            </div>
          </div>
        </Popover.Panel>
      </Popover>
    </div>
  );
});
