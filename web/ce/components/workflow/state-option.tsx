import { observer } from "mobx-react";
import { Check } from "lucide-react";
import { Combobox } from "@headlessui/react";

type Props = {
  projectId: string | null | undefined;
  option: {
    value: string | undefined;
    query: string;
    content: JSX.Element;
  };
  filterAvailableStateIds: boolean;
  selectedValue: string | null | undefined;
  className?: string;
};

export const StateOption = observer((props: Props) => {
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
