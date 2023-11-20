import { useState, useEffect, useCallback, ReactNode, useRef, useLayoutEffect } from "react";
import { Editor, Range, Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Text,
  TextQuote,
  Code,
  MinusSquare,
  CheckSquare,
  ImageIcon,
  Table,
} from "lucide-react";
import { UploadImage } from "../";
import { cn, insertTableCommand, toggleBlockquote, toggleBulletList, toggleOrderedList, toggleTaskList, insertImageCommand, toggleHeadingOne, toggleHeadingTwo, toggleHeadingThree } from "@plane/editor-core";

interface CommandItemProps {
  title: string;
  description: string;
  icon: ReactNode;
}

interface CommandProps {
  editor: Editor;
  range: Range;
}

const Command = Extension.create({
  name: "slash-command",
  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: any }) => {
          props.command({ editor, range });
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        allow({ editor }) {
          return !editor.isActive("table");
        },
        ...this.options.suggestion,
      }),
    ];
  },
});

const getSuggestionItems =
  (
    uploadFile: UploadImage,
    setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void
  ) =>
    ({ query }: { query: string }) =>
      [
        {
          title: "Text",
          description: "Just start typing with plain text.",
          searchTerms: ["p", "paragraph"],
          icon: <Text size={18} />,
          command: ({ editor, range }: CommandProps) => {
            editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run();
          },
        },
        {
          title: "Heading 1",
          description: "Big section heading.",
          searchTerms: ["title", "big", "large"],
          icon: <Heading1 size={18} />,
          command: ({ editor, range }: CommandProps) => {
            toggleHeadingOne(editor, range);
          },
        },
        {
          title: "Heading 2",
          description: "Medium section heading.",
          searchTerms: ["subtitle", "medium"],
          icon: <Heading2 size={18} />,
          command: ({ editor, range }: CommandProps) => {
            toggleHeadingTwo(editor, range);
          },
        },
        {
          title: "Heading 3",
          description: "Small section heading.",
          searchTerms: ["subtitle", "small"],
          icon: <Heading3 size={18} />,
          command: ({ editor, range }: CommandProps) => {
            toggleHeadingThree(editor, range);
          },
        },
        {
          title: "To-do List",
          description: "Track tasks with a to-do list.",
          searchTerms: ["todo", "task", "list", "check", "checkbox"],
          icon: <CheckSquare size={18} />,
          command: ({ editor, range }: CommandProps) => {
            toggleTaskList(editor, range)
          },
        },
        {
          title: "Bullet List",
          description: "Create a simple bullet list.",
          searchTerms: ["unordered", "point"],
          icon: <List size={18} />,
          command: ({ editor, range }: CommandProps) => {
            toggleBulletList(editor, range);
          },
        },
        {
          title: "Divider",
          description: "Visually divide blocks",
          searchTerms: ["line", "divider", "horizontal", "rule", "separate"],
          icon: <MinusSquare size={18} />,
          command: ({ editor, range }: CommandProps) => {
            editor.chain().focus().deleteRange(range).setHorizontalRule().run();
          },
        },
        {
          title: "Table",
          description: "Create a Table",
          searchTerms: ["table", "cell", "db", "data", "tabular"],
          icon: <Table size={18} />,
          command: ({ editor, range }: CommandProps) => {
            insertTableCommand(editor, range);
          },
        },
        {
          title: "Numbered List",
          description: "Create a list with numbering.",
          searchTerms: ["ordered"],
          icon: <ListOrdered size={18} />,
          command: ({ editor, range }: CommandProps) => {
            toggleOrderedList(editor, range)
          },
        },
        {
          title: "Quote",
          description: "Capture a quote.",
          searchTerms: ["blockquote"],
          icon: <TextQuote size={18} />,
          command: ({ editor, range }: CommandProps) =>
            toggleBlockquote(editor, range)
        },
        {
          title: "Code",
          description: "Capture a code snippet.",
          searchTerms: ["codeblock"],
          icon: <Code size={18} />,
          command: ({ editor, range }: CommandProps) =>
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
        },
        {
          title: "Image",
          description: "Upload an image from your computer.",
          searchTerms: ["photo", "picture", "media"],
          icon: <ImageIcon size={18} />,
          command: ({ editor, range }: CommandProps) => {
            insertImageCommand(editor, uploadFile, setIsSubmitting, range);
          },
        },
      ].filter((item) => {
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

const CommandList = ({
  items,
  command,
}: {
  items: CommandItemProps[];
  command: any;
  editor: any;
  range: any;
}) => {
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
      className="z-50 fixed h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-custom-border-300 bg-custom-background-100 px-1 py-2 shadow-md transition-all"
    >
      {items.map((item: CommandItemProps, index: number) => (
        <button
          className={cn(
            `flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm text-custom-text-200 hover:bg-custom-primary-100/5 hover:text-custom-text-100`,
            { "bg-custom-primary-100/5  text-custom-text-100": index === selectedIndex }
          )}
          key={index}
          onClick={() => selectItem(index)}
        >
          <div>
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-custom-text-300">{item.description}</p>
          </div>
        </button>
      ))}
    </div>
  ) : null;
};

const renderItems = () => {
  let component: ReactRenderer | null = null;
  let popup: any | null = null;

  return {
    onStart: (props: { editor: Editor; clientRect: DOMRect }) => {
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
    onUpdate: (props: { editor: Editor; clientRect: DOMRect }) => {
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
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void
) =>
  Command.configure({
    suggestion: {
      items: getSuggestionItems(uploadFile, setIsSubmitting),
      render: renderItems,
    },
  });

export default SlashCommand;
