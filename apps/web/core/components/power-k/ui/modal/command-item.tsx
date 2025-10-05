import React from "react";
import { Command } from "cmdk";
// local imports
import { KeySequenceBadge, ShortcutBadge } from "./command-item-shortcut-badge";

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
      {keySequence && <KeySequenceBadge sequence={keySequence} />}
      {shortcut && <ShortcutBadge shortcut={shortcut} />}
    </Command.Item>
  );
};
