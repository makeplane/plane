import React from "react";
import { Command } from "cmdk";

import { CheckIcon } from "@plane/propel/icons";
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

export function PowerKModalCommandItem(props: Props) {
  const { icon: Icon, iconNode, isDisabled, isSelected, keySequence, label, onSelect, shortcut, value } = props;

  return (
    <Command.Item value={value} onSelect={onSelect} className="focus:outline-none" disabled={isDisabled}>
      <div
        className={cn("flex items-center gap-2 text-secondary", {
          "opacity-70": isDisabled,
        })}
      >
        {Icon && <Icon className="shrink-0 size-3.5" />}
        {iconNode}
        {label}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {isSelected && <CheckIcon className="shrink-0 size-3 text-secondary" />}
        {keySequence && <KeySequenceBadge sequence={keySequence} />}
        {shortcut && <ShortcutBadge shortcut={shortcut} />}
      </div>
    </Command.Item>
  );
}
