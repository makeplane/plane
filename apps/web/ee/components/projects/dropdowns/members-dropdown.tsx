import { Users } from "lucide-react";
// plane imports
import { cn } from "@plane/utils";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";

type Props = {
  value: string[];
  onChange: (assigneeIds: string[]) => void;
  buttonClassName?: string;
  className?: string;
  disabled?: boolean;
  button?: React.ReactNode;
};

export const MembersDropdown: React.FC<Props> = (props) => {
  const { value, onChange, disabled = false, buttonClassName = "", className = "", button } = props;
  const DropdownLabel = () => (
    <div
      className={cn(
        "px-2 text-xs h-full flex cursor-pointer items-center gap-2 text-custom-text-200 border-[0.5px] border-custom-border-300 hover:bg-custom-background-80 rounded",
        buttonClassName
      )}
    >
      <Users className="h-3 w-3 flex-shrink-0" />
      <span>{value ? value.length : "Members"}</span>
    </div>
  );
  return (
    <MemberDropdown
      value={value}
      onChange={(assigneeIds) => {
        onChange(assigneeIds);
      }}
      buttonClassName={cn({ "hover:bg-transparent": value?.length > 0 }, buttonClassName)}
      placeholder="Members"
      button={button || <DropdownLabel />}
      className={className}
      disabled={disabled}
      buttonVariant="border-with-text"
      multiple
    />
  );
};
