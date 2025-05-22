import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePopper } from "react-popper";
// plane imports
import { ROLE } from "@plane/constants";
// plane ui
import { Avatar } from "@plane/ui";
import { cn, getFileURL } from "@plane/utils";
// constants
// helpers
// hooks
import { useMember, useUser } from "@/hooks/store";

type Props = {
  id: string;
};

export const EditorUserMention: React.FC<Props> = observer((props) => {
  const { id } = props;
  // router
  const { projectId } = useParams();
  // states
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [referenceElement, setReferenceElement] = useState<HTMLAnchorElement | null>(null);
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { data: currentUser } = useUser();
  const {
    getUserDetails,
    project: { getProjectMemberDetails },
  } = useMember();
  // popper-js refs
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });
  // derived values
  const userDetails = getUserDetails(id);
  const roleDetails = projectId ? getProjectMemberDetails(id, projectId.toString())?.role : null;
  const profileLink = `/${workspaceSlug}/profile/${id}`;

  if (!userDetails) {
    return (
      <div className="not-prose inline px-1 py-0.5 rounded bg-custom-background-80 text-custom-text-300 no-underline">
        @deactivated user
      </div>
    );
  }

  return (
    <div
      className={cn(
        "not-prose group/user-mention inline px-1 py-0.5 rounded bg-custom-primary-100/20 text-custom-primary-100 no-underline",
        {
          "bg-yellow-500/20 text-yellow-500": id === currentUser?.id,
        }
      )}
    >
      <Link href={profileLink} ref={setReferenceElement}>
        @{userDetails?.display_name}
      </Link>
      <div
        className="top-full left-0 z-10 min-w-60 bg-custom-background-90 shadow-custom-shadow-rg rounded-lg p-4 opacity-0 pointer-events-none group-hover/user-mention:opacity-100 group-hover/user-mention:pointer-events-auto transition-opacity"
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
      >
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
            <Link href={profileLink} className="not-prose font-medium text-custom-text-100 text-sm hover:underline">
              {userDetails?.first_name} {userDetails?.last_name}
            </Link>
            {roleDetails && <p className="text-custom-text-200 text-xs">{ROLE[roleDetails]}</p>}
          </div>
        </div>
      </div>
    </div>
  );
});
