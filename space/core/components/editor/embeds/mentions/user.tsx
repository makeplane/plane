import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useMember, useUser } from "@/hooks/store";

type Props = {
  id: string;
};

export const EditorUserMention: React.FC<Props> = observer((props) => {
  const { id } = props;
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { data: currentUser } = useUser();
  const { getMemberById } = useMember();
  // derived values
  const userDetails = getMemberById(id);
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
      className={cn("not-prose inline px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-500 no-underline", {
        "bg-custom-primary-100/20 text-custom-primary-100": id === currentUser?.id,
      })}
    >
      <Link href={profileLink}>@{userDetails?.member__display_name}</Link>
    </div>
  );
});
