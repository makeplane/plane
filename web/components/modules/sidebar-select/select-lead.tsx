import { FC } from "react";
import { ChevronDown, UserCircle2 } from "lucide-react";
import { observer } from "mobx-react-lite";
// hooks
import { useMember } from "hooks/store";
// ui
import { Avatar, CustomSearchSelect } from "@plane/ui";

type Props = {
  value: string | null | undefined;
  onChange: (val: string) => void;
  disabled?: boolean;
};

export const SidebarLeadSelect: FC<Props> = observer((props) => {
  const { value, onChange, disabled = false } = props;
  // store hooks
  const {
    getUserDetails,
    project: { projectMemberIds },
  } = useMember();

  const options = projectMemberIds?.map((memberId) => {
    const member = getUserDetails(memberId);
    return {
      value: `${member?.id}`,
      query: member?.display_name ?? "",
      content: (
        <div className="flex items-center gap-2">
          <Avatar name={member?.display_name} src={member?.avatar} />
          {member?.display_name}
        </div>
      ),
    };
  });

  const selectedOption = getUserDetails(projectMemberIds?.find((m) => m === value) || "");

  return (
    <div className="flex items-center justify-start gap-1">
      <div className="flex w-1/2 items-center justify-start gap-2 text-custom-text-300">
        <UserCircle2 className="h-4 w-4" />
        <span className="text-base">Lead</span>
      </div>
      <div className="flex w-1/2 items-center rounded-sm">
        <CustomSearchSelect
          disabled={disabled}
          className="w-full rounded-sm"
          value={value}
          customButtonClassName="rounded-sm"
          customButton={
            selectedOption ? (
              <div className="flex w-full items-center justify-start gap-2 p-0.5">
                <Avatar name={selectedOption.display_name} src={selectedOption.avatar} />
                <span className="text-sm text-custom-text-200">{selectedOption?.display_name}</span>
              </div>
            ) : (
              <div className="group flex w-full items-center justify-between gap-2 p-1 text-sm text-custom-text-400">
                <span>No lead</span>
                {!disabled && <ChevronDown className="hidden h-3.5 w-3.5 group-hover:flex" />}
              </div>
            )
          }
          options={options}
          maxHeight="md"
          onChange={onChange}
        />
      </div>
    </div>
  );
});
