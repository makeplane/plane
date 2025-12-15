import { observer } from "mobx-react";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUser } from "@/hooks/store/use-user";

type Props = {
  id: string;
};

export const EditorUserMention = observer(function EditorUserMention(props: Props) {
  const { id } = props;
  // store hooks
  const { data: currentUser } = useUser();
  const { getMemberById } = useMember();
  // derived values
  const userDetails = getMemberById(id);

  if (!userDetails) {
    return (
      <div className="not-prose inline px-1 py-0.5 rounded-sm bg-layer-1 text-tertiary no-underline">
        @deactivated user
      </div>
    );
  }

  return (
    <div
      className={cn("not-prose inline px-1 py-0.5 rounded-sm bg-accent-primary/20 text-accent-primary no-underline", {
        "bg-yellow-500/20 text-yellow-500": id === currentUser?.id,
      })}
    >
      @{userDetails?.member__display_name}
    </div>
  );
});
