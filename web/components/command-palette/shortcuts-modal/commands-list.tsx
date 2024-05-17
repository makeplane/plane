import { Command } from "lucide-react";
// helpers
import { substringMatch } from "@/helpers/string.helper";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  searchQuery: string;
};

export const ShortcutCommandsList: React.FC<Props> = (props) => {
  const { searchQuery } = props;
  const { platform } = usePlatformOS();

  const KEYBOARD_SHORTCUTS = [
    {
      key: "navigation",
      title: "Navigation",
      shortcuts: [{ keys: "Ctrl,K", description: "Open command menu" }],
    },
    {
      key: "common",
      title: "Common",
      shortcuts: [
        { keys: "P", description: "Create project" },
        { keys: "C", description: "Create issue" },
        { keys: "Q", description: "Create cycle" },
        { keys: "M", description: "Create module" },
        { keys: "V", description: "Create view" },
        { keys: "D", description: "Create page" },
        { keys: "Delete", description: "Bulk delete issues" },
        { keys: "H", description: "Open shortcuts guide" },
        {
          keys: platform === "MacOS" ? "Ctrl,control,C" : "Ctrl,Alt,C",
          description: "Copy issue URL from the issue details page",
        },
      ],
    },
  ];

  const filteredShortcuts = KEYBOARD_SHORTCUTS.map((category) => {
    const newCategory = { ...category };

    newCategory.shortcuts = newCategory.shortcuts.filter((shortcut) =>
      substringMatch(shortcut.description, searchQuery)
    );

    return newCategory;
  });

  const isShortcutsEmpty = filteredShortcuts.every((category) => category.shortcuts.length === 0);

  return (
    <div className="flex flex-col gap-y-3 overflow-y-auto">
      {!isShortcutsEmpty ? (
        filteredShortcuts.map((category) => {
          if (category.shortcuts.length === 0) return;

          return (
            <div key={category.key}>
              <h5 className="text-left text-sm font-medium">{category.title}</h5>
              <div className="space-y-3 px-1">
                {category.shortcuts.map((shortcut) => (
                  <div key={shortcut.keys} className="mt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs text-custom-text-200 text-left">{shortcut.description}</h4>
                      <div className="flex items-center gap-x-1.5">
                        {shortcut.keys.split(",").map((key) => (
                          <div key={key} className="flex items-center gap-1">
                            {key === "Ctrl" ? (
                              <div className="grid h-6 min-w-[1.5rem] place-items-center rounded-sm border-[0.5px] border-custom-border-200 bg-custom-background-90 px-1.5 text-[10px] text-custom-text-200">
                                { platform === "MacOS" ? <Command className="h-2.5 w-2.5 text-custom-text-200" /> : 'Ctrl'}
                              </div>
                            ) : (
                              <kbd className="grid h-6 min-w-[1.5rem] place-items-center rounded-sm border-[0.5px] border-custom-border-200 bg-custom-background-90 px-1.5 text-[10px] text-custom-text-200">
                                {key}
                              </kbd>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <p className="flex justify-center text-center text-sm text-custom-text-200">
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
};
