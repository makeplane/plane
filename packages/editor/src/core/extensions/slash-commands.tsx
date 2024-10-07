import { useState, useEffect, useCallback, ReactNode, useRef, useLayoutEffect } from "react";
import { Editor, Range, Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";
import tippy from "tippy.js";
import {
  CaseSensitive,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  ImageIcon,
  List,
  ListOrdered,
  ListTodo,
  MinusSquare,
  Quote,
  Table,
} from "lucide-react";
// helpers
import { cn } from "@/helpers/common";
import {
  insertTableCommand,
  toggleBlockquote,
  toggleBulletList,
  toggleOrderedList,
  toggleTaskList,
  toggleHeadingOne,
  toggleHeadingTwo,
  toggleHeadingThree,
  toggleHeadingFour,
  toggleHeadingFive,
  toggleHeadingSix,
  insertImage,
} from "@/helpers/editor-commands";
// types
import { CommandProps, ISlashCommandItem } from "@/types";

interface CommandItemProps {
  key: string;
  title: string;
  description: string;
  icon: ReactNode;
}

export type SlashCommandOptions = {
  suggestion: Omit<SuggestionOptions, "editor">;
};

const Command = Extension.create<SlashCommandOptions>({
  name: "slash-command",
  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: any }) => {
          props.command({ editor, range });
        },
        allow({ editor }: { editor: Editor }) {
          const { selection } = editor.state;

          const parentNode = selection.$from.node(selection.$from.depth);
          const blockType = parentNode.type.name;

          if (blockType === "codeBlock") {
            return false;
          }

          if (editor.isActive("table")) {
            return false;
          }

          return true;
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

const getSuggestionItems =
  (additionalOptions?: Array<ISlashCommandItem>) =>
  ({ query }: { query: string }) => {
    let slashCommands: ISlashCommandItem[] = [
      {
        key: "text",
        title: "Text",
        description: "Just start typing with plain text.",
        searchTerms: ["p", "paragraph"],
        icon: <CaseSensitive className="size-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          if (range) {
            editor.chain().focus().deleteRange(range).clearNodes().run();
          }
          editor.chain().focus().clearNodes().run();
        },
      },
      {
        key: "h1",
        title: "Heading 1",
        description: "Big section heading.",
        searchTerms: ["title", "big", "large"],
        icon: <Heading1 className="size-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          toggleHeadingOne(editor, range);
        },
      },
      {
        key: "h2",
        title: "Heading 2",
        description: "Medium section heading.",
        searchTerms: ["subtitle", "medium"],
        icon: <Heading2 className="size-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          toggleHeadingTwo(editor, range);
        },
      },
      {
        key: "h3",
        title: "Heading 3",
        description: "Small section heading.",
        searchTerms: ["subtitle", "small"],
        icon: <Heading3 className="size-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          toggleHeadingThree(editor, range);
        },
      },
      {
        key: "h4",
        title: "Heading 4",
        description: "Small section heading.",
        searchTerms: ["subtitle", "small"],
        icon: <Heading4 className="size-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          toggleHeadingFour(editor, range);
        },
      },
      {
        key: "h5",
        title: "Heading 5",
        description: "Small section heading.",
        searchTerms: ["subtitle", "small"],
        icon: <Heading5 className="size-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          toggleHeadingFive(editor, range);
        },
      },
      {
        key: "h6",
        title: "Heading 6",
        description: "Small section heading.",
        searchTerms: ["subtitle", "small"],
        icon: <Heading6 className="size-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          toggleHeadingSix(editor, range);
        },
      },
      {
        key: "to-do-list",
        title: "To do",
        description: "Track tasks with a to-do list.",
        searchTerms: ["todo", "task", "list", "check", "checkbox"],
        icon: <ListTodo className="size-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          toggleTaskList(editor, range);
        },
      },
      {
        key: "bulleted-list",
        title: "Bullet list",
        description: "Create a simple bullet list.",
        searchTerms: ["unordered", "point"],
        icon: <List className="size-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          toggleBulletList(editor, range);
        },
      },
      {
        key: "numbered-list",
        title: "Numbered list",
        description: "Create a list with numbering.",
        searchTerms: ["ordered"],
        icon: <ListOrdered className="size-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          toggleOrderedList(editor, range);
        },
      },
      {
        key: "table",
        title: "Table",
        description: "Create a table",
        searchTerms: ["table", "cell", "db", "data", "tabular"],
        icon: <Table className="size-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          insertTableCommand(editor, range);
        },
      },
      {
        key: "quote",
        title: "Quote",
        description: "Capture a quote.",
        searchTerms: ["blockquote"],
        icon: <Quote className="size-3.5" />,
        command: ({ editor, range }: CommandProps) => toggleBlockquote(editor, range),
      },
      {
        key: "code",
        title: "Code",
        description: "Capture a code snippet.",
        searchTerms: ["codeblock"],
        icon: <Code2 className="size-3.5" />,
        command: ({ editor, range }: CommandProps) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
      },
      {
        key: "image",
        title: "Image",
        icon: <ImageIcon className="size-3.5" />,
        description: "Insert an image",
        searchTerms: ["img", "photo", "picture", "media", "upload"],
        command: ({ editor, range }: CommandProps) => insertImage({ editor, event: "insert", range }),
      },
      {
        key: "divider",
        title: "Divider",
        description: "Visually divide blocks.",
        searchTerms: ["line", "divider", "horizontal", "rule", "separate"],
        icon: <MinusSquare className="size-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setHorizontalRule().run();
        },
      },
    ];

    if (additionalOptions) {
      additionalOptions.map((item) => {
        slashCommands.push(item);
      });
    }

    slashCommands = slashCommands.filter((item) => {
      if (typeof query === "string" && query.length > 0) {
        const search = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(search) ||
          item.description.toLowerCase().includes(search) ||
          (item.searchTerms && item.searchTerms.some((term: string) => term.includes(search)))
        );
      }
      return true;
    });

    return slashCommands;
  };

export const updateScrollView = (container: HTMLElement, item: HTMLElement) => {
  const containerHeight = container.offsetHeight;
  const itemHeight = item ? item.offsetHeight : 0;

  const top = item.offsetTop;
  const bottom = top + itemHeight;

  if (top < container.scrollTop) {
    container.scrollTop -= container.scrollTop - top + 5;
  } else if (bottom > containerHeight + container.scrollTop) {
    container.scrollTop += bottom - containerHeight - container.scrollTop + 5;
  }
};

const CommandList = ({ items, command }: { items: CommandItemProps[]; command: any; editor: any; range: any }) => {
  // states
  const [selectedIndex, setSelectedIndex] = useState(0);
  // refs
  const commandListContainer = useRef<HTMLDivElement>(null);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) command(item);
    },
    [command, items]
  );

  useEffect(() => {
    const navigationKeys = ["ArrowUp", "ArrowDown", "Enter"];
    const onKeyDown = (e: KeyboardEvent) => {
      if (navigationKeys.includes(e.key)) {
        e.preventDefault();
        if (e.key === "ArrowUp") {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length);
          return true;
        }
        if (e.key === "ArrowDown") {
          setSelectedIndex((selectedIndex + 1) % items.length);
          return true;
        }
        if (e.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [items, selectedIndex, setSelectedIndex, selectItem]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useLayoutEffect(() => {
    const container = commandListContainer?.current;

    const item = container?.children[selectedIndex] as HTMLElement;

    if (item && container) updateScrollView(container, item);
  }, [selectedIndex]);

  if (items.length <= 0) return null;

  return (
    <div
      id="slash-command"
      ref={commandListContainer}
      className="z-10 max-h-80 min-w-[12rem] overflow-y-auto rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 shadow-custom-shadow-rg"
    >
      {items.map((item, index) => (
        <button
          key={item.key}
          className={cn(
            "flex items-center gap-2 w-full rounded px-1 py-1.5 text-sm text-left truncate text-custom-text-200 hover:bg-custom-background-80",
            {
              "bg-custom-background-80": index === selectedIndex,
            }
          )}
          onClick={(e) => {
            e.stopPropagation();
            selectItem(index);
          }}
        >
          <span className="grid place-items-center flex-shrink-0">{item.icon}</span>
          <p className="flex-grow truncate">{item.title}</p>
        </button>
      ))}
    </div>
  );
};

interface CommandListInstance {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const renderItems = () => {
  let component: ReactRenderer<CommandListInstance, typeof CommandList> | null = null;
  let popup: any | null = null;
  return {
    onStart: (props: { editor: Editor; clientRect?: (() => DOMRect | null) | null }) => {
      component = new ReactRenderer(CommandList, {
        props,
        editor: props.editor,
      });

      const tippyContainer =
        document.querySelector(".active-editor") ?? document.querySelector('[id^="editor-container"]');

      // @ts-expect-error Tippy overloads are messed up
      popup = tippy("body", {
        getReferenceClientRect: props.clientRect,
        appendTo: tippyContainer,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },
    onUpdate: (props: { editor: Editor; clientRect?: (() => DOMRect | null) | null }) => {
      component?.updateProps(props);

      popup &&
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
    },
    onKeyDown: (props: { event: KeyboardEvent }) => {
      if (props.event.key === "Escape") {
        popup?.[0].hide();

        return true;
      }

      if (component?.ref?.onKeyDown(props)) {
        return true;
      }
      return false;
    },
    onExit: () => {
      popup?.[0].destroy();
      component?.destroy();
    },
  };
};

export const SlashCommand = (additionalOptions?: Array<ISlashCommandItem>) =>
  Command.configure({
    suggestion: {
      items: getSuggestionItems(additionalOptions),
      render: renderItems,
    },
  });
