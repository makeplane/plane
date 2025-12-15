// plane imports
import { useTranslation } from "@plane/i18n";
import { substringMatch } from "@plane/utils";
// components
import type { TPowerKCommandConfig, TPowerKCommandGroup } from "@/components/power-k/core/types";
import { KeySequenceBadge, ShortcutBadge } from "@/components/power-k/ui/modal/command-item-shortcut-badge";
// types
import { CONTEXT_ENTITY_MAP } from "@/components/power-k/ui/pages/context-based";
// local imports
import { POWER_K_GROUP_I18N_TITLES, POWER_K_GROUP_PRIORITY } from "./shared";

type Props = {
  searchQuery: string;
  commands: TPowerKCommandConfig[];
};

export function ShortcutRenderer(props: Props) {
  const { searchQuery, commands } = props;
  // translation
  const { t } = useTranslation();

  // Apply search filter
  const filteredCommands = commands.filter((command) => substringMatch(t(command.i18n_title), searchQuery));

  // Group commands - separate contextual by context type, others by group
  type GroupedCommands = {
    key: string;
    title: string;
    priority: number;
    commands: TPowerKCommandConfig[];
  };

  const groupedCommands: GroupedCommands[] = [];

  filteredCommands.forEach((command) => {
    if (command.group === "contextual") {
      // For contextual commands, group by context type
      const contextKey = `contextual-${command.contextType}`;
      let group = groupedCommands.find((g) => g.key === contextKey);

      if (!group) {
        group = {
          key: contextKey,
          title: t(CONTEXT_ENTITY_MAP[command.contextType].i18n_title),
          priority: POWER_K_GROUP_PRIORITY.contextual,
          commands: [],
        };
        groupedCommands.push(group);
      }
      group.commands.push(command);
    } else {
      // For other commands, group by command group
      const groupKey = command.group || "general";
      let group = groupedCommands.find((g) => g.key === groupKey);

      if (!group) {
        group = {
          key: groupKey,
          title: t(POWER_K_GROUP_I18N_TITLES[groupKey as TPowerKCommandGroup]),
          priority: POWER_K_GROUP_PRIORITY[groupKey as TPowerKCommandGroup],
          commands: [],
        };
        groupedCommands.push(group);
      }
      group.commands.push(command);
    }
  });

  // Sort groups by priority
  groupedCommands.sort((a, b) => a.priority - b.priority);

  const isShortcutsEmpty = groupedCommands.length === 0;

  return (
    <div className="flex flex-col gap-y-3 overflow-y-auto">
      {!isShortcutsEmpty ? (
        groupedCommands.map((group) => (
          <div key={group.key}>
            <h5 className="text-left text-13 font-medium pt-1 pb-2">{group.title}</h5>
            <div className="space-y-3 px-1">
              {group.commands.map((command) => (
                <div key={command.id} className="mt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-11 text-secondary text-left">{t(command.i18n_title)}</h4>
                    <div className="flex items-center gap-x-1.5">
                      {command.keySequence && <KeySequenceBadge sequence={command.keySequence} />}
                      {(command.shortcut || command.modifierShortcut) && (
                        <ShortcutBadge shortcut={command.shortcut || command.modifierShortcut} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p className="flex justify-center text-center text-13 text-secondary">
          No shortcuts found for{" "}
          <span className="font-semibold italic">
            {`"`}
            {searchQuery}
            {`"`}
          </span>
        </p>
      )}
    </div>
  );
}
