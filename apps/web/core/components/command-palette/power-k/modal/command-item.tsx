import React from "react";
import { Command } from "cmdk";
import { LucideIcon } from "lucide-react";
import type { ISvgIcons } from "@plane/propel/icons";

type Props = {
  icon?: React.ComponentType<{ className?: string }>;
  keySequence?: string;
  label: string | React.ReactNode;
  onSelect: () => void;
  shortcut?: string;
  value?: string;
};

export const PowerKModalCommandItem: React.FC<Props> = (props) => {
  const { icon: Icon, keySequence, label, onSelect, shortcut, value } = props;

  return (
    <Command.Item value={value} onSelect={onSelect} className="focus:outline-none">
      <div className="flex items-center gap-2 text-custom-text-200">
        {Icon && <Icon className="shrink-0 size-3.5" />}
        {label}
      </div>
      {keySequence && keySequence.split("").map((key, index) => <kbd key={index}>{key.toUpperCase()}</kbd>)}
      {shortcut && <kbd>{shortcut.toUpperCase()}</kbd>}
    </Command.Item>
  );
};
