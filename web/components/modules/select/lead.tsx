import React from "react";
import { observer } from "mobx-react-lite";
import { Combobox } from "@headlessui/react";
import { UserCircle } from "lucide-react";
// hooks
import { useMember } from "hooks/store";
// ui
import { Avatar, CustomSearchSelect } from "@plane/ui";

type Props = {
  value: string | null;
  onChange: () => void;
};

export const ModuleLeadSelect: React.FC<Props> = observer((props) => {
  const { value, onChange } = props;
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
    <CustomSearchSelect
      options={options}
      value={value}
      label={
        <div className="flex items-center gap-2">
          {selectedOption ? (
            <Avatar name={selectedOption.display_name} src={selectedOption.avatar} />
          ) : (
            <UserCircle className="h-3 w-3 text-custom-text-300" />
          )}
          {selectedOption ? (
            selectedOption?.display_name
          ) : (
            <span className={`${selectedOption ? "text-custom-text-200" : "text-custom-text-300"}`}>Lead</span>
          )}
        </div>
      }
      footerOption={
        <Combobox.Option
          value=""
          className="flex cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5  text-custom-text-200"
        >
          <span className="flex items-center justify-start gap-1 text-custom-text-200">
            <span>No Lead</span>
          </span>
        </Combobox.Option>
      }
      onChange={onChange}
      noChevron
    />
  );
});
