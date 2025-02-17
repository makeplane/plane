import { observer } from "mobx-react";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useMember, useUser } from "@/hooks/store";

type Props = {
  id: string;
};

export const EditorUserMention: React.FC<Props> = observer((props) => {
  const { id } = props;
  // store hooks
  const { data: currentUser } = useUser();
  const { getMemberById } = useMember();
  // derived values
  const userDetails = getMemberById(id);

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
        "not-prose inline px-1 py-0.5 rounded bg-custom-primary-100/20 text-custom-primary-100 no-underline",
        {
          "bg-yellow-500/20 text-yellow-500": id === currentUser?.id,
        }
      )}
    >
      @{userDetails?.member__display_name}
    </div>
  );
});
