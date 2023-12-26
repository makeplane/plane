import { useState, useEffect, useCallback, ReactNode, useRef, useLayoutEffect } from "react";
import { Editor, Range, Extension } from "@tiptap/core";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import {
  CaseSensitive,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  List,
  ListOrdered,
  ListTodo,
  MinusSquare,
  Quote,
  Table,
} from "lucide-react";
import {
  UploadImage,
  ISlashCommandItem,
  CommandProps,
  cn,
  insertTableCommand,
  toggleBlockquote,
  toggleBulletList,
  toggleOrderedList,
  toggleTaskList,
  insertImageCommand,
  toggleHeadingOne,
  toggleHeadingTwo,
  toggleHeadingThree,
} from "@plane/editor-core";

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
          return !editor.isActive("table");
        },
        allowSpaces: true,
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
  (
    uploadFile: UploadImage,
    setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void,
    additionalOptions?: Array<ISlashCommandItem>
  ) =>
  ({ query }: { query: string }) => {
    let slashCommands: ISlashCommandItem[] = [
      {
        key: "text",
        title: "Text",
        description: "Just start typing with plain text.",
        searchTerms: ["p", "paragraph"],
        icon: <CaseSensitive className="h-3.5 w-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run();
        },
      },
      {
        key: "heading_1",
        title: "Heading 1",
        description: "Big section heading.",
        searchTerms: ["title", "big", "large"],
        icon: <Heading1 className="h-3.5 w-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          toggleHeadingOne(editor, range);
        },
      },
      {
        key: "heading_2",
        title: "Heading 2",
        description: "Medium section heading.",
        searchTerms: ["subtitle", "medium"],
        icon: <Heading2 className="h-3.5 w-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          toggleHeadingTwo(editor, range);
        },
      },
      {
        key: "heading_3",
        title: "Heading 3",
        description: "Small section heading.",
        searchTerms: ["subtitle", "small"],
        icon: <Heading3 className="h-3.5 w-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          toggleHeadingThree(editor, range);
        },
      },
      {
        key: "todo_list",
        title: "To do",
        description: "Track tasks with a to-do list.",
        searchTerms: ["todo", "task", "list", "check", "checkbox"],
        icon: <ListTodo className="h-3.5 w-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          toggleTaskList(editor, range);
        },
      },
      {
        key: "bullet_list",
        title: "Bullet list",
        description: "Create a simple bullet list.",
        searchTerms: ["unordered", "point"],
        icon: <List className="h-3.5 w-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          toggleBulletList(editor, range);
        },
      },
      {
        key: "numbered_list",
        title: "Numbered list",
        description: "Create a list with numbering.",
        searchTerms: ["ordered"],
        icon: <ListOrdered className="h-3.5 w-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          toggleOrderedList(editor, range);
        },
      },
      {
        key: "table",
        title: "Table",
        description: "Create a table",
        searchTerms: ["table", "cell", "db", "data", "tabular"],
        icon: <Table className="h-3.5 w-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          insertTableCommand(editor, range);
        },
      },
      {
        key: "quote_block",
        title: "Quote",
        description: "Capture a quote.",
        searchTerms: ["blockquote"],
        icon: <Quote className="h-3.5 w-3.5" />,
        command: ({ editor, range }: CommandProps) => toggleBlockquote(editor, range),
      },
      {
        key: "code_block",
        title: "Code",
        description: "Capture a code snippet.",
        searchTerms: ["codeblock"],
        icon: <Code2 className="h-3.5 w-3.5" />,
        command: ({ editor, range }: CommandProps) =>
          // @ts-expect-error I have to move this to the core
          editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
      },
      {
        key: "image",
        title: "Image",
        description: "Upload an image from your computer.",
        searchTerms: ["img", "photo", "picture", "media"],
        icon: <ImageIcon className="h-3.5 w-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          insertImageCommand(editor, uploadFile, setIsSubmitting, range);
        },
      },
      {
        key: "divider",
        title: "Divider",
        description: "Visually divide blocks.",
        searchTerms: ["line", "divider", "horizontal", "rule", "separate"],
        icon: <MinusSquare className="h-3.5 w-3.5" />,
        command: ({ editor, range }: CommandProps) => {
          // @ts-expect-error I have to move this to the core
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
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
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

  const commandListContainer = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = commandListContainer?.current;

    const item = container?.children[selectedIndex] as HTMLElement;

    if (item && container) updateScrollView(container, item);
  }, [selectedIndex]);

  return items.length > 0 ? (
    <div
      id="slash-command"
      ref={commandListContainer}
      className="fixed z-50 h-auto max-h-[330px] w-52 overflow-y-auto rounded-md border border-custom-border-300 bg-custom-background-100 px-1 py-2 shadow-md transition-all"
    >
      {items.map((item, index) => (
        <button
          key={item.key}
          className={cn(
            `flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-custom-text-100 hover:bg-custom-primary-100/5`,
            {
              "bg-custom-primary-100/5": index === selectedIndex,
            }
          )}
          onClick={() => selectItem(index)}
        >
          <div className="grid flex-shrink-0 place-items-center">{item.icon}</div>
          <p>{item.title}</p>
        </button>
      ))}
    </div>
  ) : null;
};

const renderItems = () => {
  let component: ReactRenderer | null = null;
  let popup: any | null = null;

  return {
    onStart: (props: { editor: Editor; clientRect?: (() => DOMRect | null) | null }) => {
      component = new ReactRenderer(CommandList, {
        props,
        // @ts-ignore
        editor: props.editor,
      });

      // @ts-ignore
      popup = tippy("body", {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.querySelector("#editor-container"),
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

      // @ts-ignore
      return component?.ref?.onKeyDown(props);
    },
    onExit: () => {
      popup?.[0].destroy();
      component?.destroy();
    },
  };
};

export const SlashCommand = (
  uploadFile: UploadImage,
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void,
  additionalOptions?: Array<ISlashCommandItem>
) =>
  Command.configure({
    suggestion: {
      items: getSuggestionItems(uploadFile, setIsSubmitting, additionalOptions),
      render: renderItems,
    },
  });
