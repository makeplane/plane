import { useState } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
// helpers
import { cn  } from "@plane/utils";
// components
import { AddTeamspaceMembersModal } from "./modal";

type TAddTeamspaceMembersButtonProps = {
  teamspaceId: string;
  variant: "icon" | "sidebar";
  isEditingAllowed: boolean;
};

const AddMembersIcon = observer(
  (props: { containerSize: number; iconSize: number; containerClassName?: string; iconClassName?: string }) => {
    const { containerSize, iconSize, containerClassName, iconClassName } = props;
    return (
      <div
        style={{
          width: containerSize,
          height: containerSize,
        }}
        className={cn(
          `bg-custom-background-80/60 hover:bg-custom-background-80 group-hover:bg-custom-background-80 rounded-full flex items-center justify-center`,
          containerClassName
        )}
      >
        <Plus
          style={{
            width: iconSize,
            height: iconSize,
          }}
          className={cn(
            "text-custom-text-400 hover:text-custom-text-300 group-hover:text-custom-text-300",
            iconClassName
          )}
          strokeWidth={2}
        />
      </div>
    );
  }
);

const AddTeamspaceMembersButton = observer((props: TAddTeamspaceMembersButtonProps) => {
  const { teamspaceId, variant, isEditingAllowed } = props;
  // state
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);

  if (!isEditingAllowed) return null;

  return (
    <>
      <AddTeamspaceMembersModal
        teamspaceId={teamspaceId}
        isModalOpen={isAddMembersModalOpen}
        handleModalClose={() => setIsAddMembersModalOpen(false)}
      />
      <div className="flex-shrink-0 cursor-pointer" onClick={() => setIsAddMembersModalOpen(true)}>
        {variant === "icon" && <AddMembersIcon containerSize={24} iconSize={16} />}
        {variant === "sidebar" && (
          <div className="group flex items-center gap-x-2">
            <span className="flex-shrink-0 relative rounded-full">
              <AddMembersIcon containerSize={32} iconSize={18} />
            </span>
            <span className="text-sm font-medium text-custom-text-400 group-hover:text-custom-text-300">
              Add new member
            </span>
          </div>
        )}
      </div>
    </>
  );
});

export default AddTeamspaceMembersButton;
