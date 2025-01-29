import React from "react";
import { Command } from "cmdk";
import { LucideIcon } from "lucide-react";
import type { ISvgIcons } from "@plane/ui";

type Props = {
  icon?: LucideIcon | React.FC<ISvgIcons> | JSX.Element;
  label: string | React.ReactNode;
  onSelect: () => void;
  shortcut?: string;
  value?: string;
};

export const PowerKCommandItem: React.FC<Props> = (props) => {
  const { label, onSelect, shortcut, value } = props;

  const renderIcon = () => {
    if (!props.icon) return null;

    if (React.isValidElement(props.icon)) return props.icon;

    // @ts-expect-error hardcoded types
    if (typeof props.icon === "function" || (props.icon as LucideIcon).$$typeof) {
      // @ts-expect-error hardcoded types
      return <props.icon className="flex-shrink-0 size-3.5" />;
    }

    return null;
  };

  return (
    <Command.Item value={value} onSelect={onSelect} className="focus:outline-none">
      <div className="flex items-center gap-2 text-custom-text-200">
        {renderIcon()}
        {label}
      </div>
      {shortcut && <kbd>{shortcut}</kbd>}
    </Command.Item>
  );
};
