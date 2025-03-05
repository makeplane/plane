import { observer } from "mobx-react";
import { Check } from "lucide-react";
import { Combobox } from "@headlessui/react";

export type TStateOptionProps = {
  projectId: string | null | undefined;
  option: {
    value: string | undefined;
    query: string;
    content: JSX.Element;
  };
  selectedValue: string | null | undefined;
  className?: string;
  filterAvailableStateIds?: boolean;
  isForWorkItemCreation?: boolean;
  alwaysAllowStateChange?: boolean;
};

export const StateOption = observer((props: TStateOptionProps) => {
  const { option, className = "" } = props;

  return (
    <Combobox.Option
      key={option.value}
      value={option.value}
      className={({ active, selected }) =>
        `${className} ${active ? "bg-custom-background-80" : ""} ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
      }
    >
      {({ selected }) => (
        <>
          <span className="flex-grow truncate">{option.content}</span>
          {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
        </>
      )}
    </Combobox.Option>
  );
});
