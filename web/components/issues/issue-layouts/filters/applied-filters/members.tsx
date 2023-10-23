import { observer } from "mobx-react-lite";

// ui
import { Avatar } from "components/ui";
// icons
import { X } from "lucide-react";
// types
import { IUserLite } from "types";

type Props = {
  handleRemove: (val: string) => void;
  members: IUserLite[] | undefined;
  values: string[];
};

export const AppliedMembersFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, members, values } = props;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {values.map((memberId) => {
        const memberDetails = members?.find((m) => m.id === memberId);

        if (!memberDetails) return null;

        return (
          <div key={memberId} className="text-xs flex items-center gap-1 bg-custom-background-80 p-1 rounded">
            <Avatar user={memberDetails} height="16px" width="16px" />
            <span className="normal-case">{memberDetails.display_name}</span>
            <button
              type="button"
              className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
              onClick={() => handleRemove(memberId)}
            >
              <X size={10} strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </div>
  );
});
