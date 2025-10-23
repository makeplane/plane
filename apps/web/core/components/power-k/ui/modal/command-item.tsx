import React from "react";
import { Command } from "cmdk";
import { Check } from "lucide-react";
// plane imports
import { cn } from "@plane/utils";
// local imports
import { KeySequenceBadge, ShortcutBadge } from "./command-item-shortcut-badge";

type Props = {
  icon?: React.ComponentType<{ className?: string }>;
  iconNode?: React.ReactNode;
  isDisabled?: boolean;
  isSelected?: boolean;
  keySequence?: string;
  label: string | React.ReactNode;
  onSelect: () => void;
  shortcut?: string;
  value?: string;
};

export const PowerKModalCommandItem: React.FC<Props> = (props) => {
  const { icon: Icon, iconNode, isDisabled, isSelected, keySequence, label, onSelect, shortcut, value } = props;

  return (
    <Command.Item value={value} onSelect={onSelect} className="focus:outline-none" disabled={isDisabled}>
      <div
        className={cn("flex items-center gap-2 text-custom-text-200", {
          "opacity-70": isDisabled,
        })}
      >
        {Icon && <Icon className="shrink-0 size-3.5" />}
        {iconNode}
        {label}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {isSelected && <Check className="shrink-0 size-3 text-custom-text-200" />}
        {keySequence && <KeySequenceBadge sequence={keySequence} />}
        {shortcut && <ShortcutBadge shortcut={shortcut} />}
      </div>
    </Command.Item>
  );
};
