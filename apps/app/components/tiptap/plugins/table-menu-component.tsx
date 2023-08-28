import {
  mdiKeyboardCloseOutline,
  mdiTableColumnPlusAfter,
  mdiTableColumnPlusBefore,
  mdiTableHeadersEye,
  mdiTableHeadersEyeOff,
  mdiTableRemove,
  mdiTableRowPlusAfter,
  mdiTableRowPlusBefore
} from "@mdi/js";
import { ChainedCommands } from "@tiptap/core";
import clsx from "clsx";
import { FC, useMemo } from "react";

interface TableMenuProps {
  state: {
    container: HTMLElement | null;
  };
}

const TableMenu: FC<TableMenuProps> = (props) => {
  const hasHeader = useMemo(() => props.state.container?.querySelector("tr:first-child > th") !== null, [props.state.container]);
  const runCommand = (fn: (chain: ChainedCommands) => void): void => {
    const chain = props.state.editor.chain();

    if (hasHeader()) {
      chain.toggleHeaderRow();
    }

    fn(chain);

    if (hasHeader()) {
      chain.toggleHeaderRow();
    }

    chain.fixTables().focus().run();
  };

  return (
    <Show when={props.state.editor.isEditable}>
      <Card
        class={clsx(
          "mb-2 p-1 flex gap-2 m-0",
          !breakpoints.md() && "fixed w-screen -left-1 rounded-none border-x-0"
        )}
      >
        <For
          each={[
            {
              icon: mdiTableRowPlusBefore,
              label: "Insert row above",
              onClick() {
                runCommand((chain) => chain.addRowBefore());
              }
            },
            {
              icon: mdiTableRowPlusAfter,
              label: "Insert row below",
              onClick() {
                runCommand((chain) => chain.addRowAfter());
              }
            },
            {
              icon: mdiTableColumnPlusBefore,
              label: "Insert column left",
              onClick() {
                runCommand((chain) => chain.addColumnBefore());
              }
            },
            {
              icon: mdiTableColumnPlusAfter,
              label: "Insert column right",
              onClick() {
                runCommand((chain) => chain.addColumnAfter());
              }
            },
            {
              label() {
                return hasHeader() ? "Remove header row" : "Add header row";
              },
              icon() {
                return hasHeader() ? mdiTableHeadersEyeOff : mdiTableHeadersEye;
              },
              onClick() {
                props.state.editor.chain().focus().toggleHeaderRow().run();
              }
            },
            {
              icon: mdiTableRemove,
              label: "Delete table",
              onClick() {
                props.state.editor.chain().deleteTable().focus().run();
              }
            },
            ...((!breakpoints.md() && [
              {
                icon: mdiKeyboardCloseOutline,
                label: "Close keyboard",
                async onClick() {
                  props.state.editor.commands.blur();
                }
              }
            ]) ||
              [])
          ]}
        >
          {(menuItem) => {
            return (
              <Tooltip
                text={typeof menuItem.label === "string" ? menuItem.label : menuItem.label()}
                class="mt-1"
              >
                <IconButton
                  path={typeof menuItem.icon === "string" ? menuItem.icon : menuItem.icon()}
                  variant="text"
                  text="soft"
                  class="m-0"
                  onClick={menuItem.onClick}
                />
              </Tooltip>
            );
          }}
        </For>
      </Card>
    </Show>
  );
};

export { TableMenu };
