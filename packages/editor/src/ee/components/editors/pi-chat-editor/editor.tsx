import Document from "@tiptap/extension-document";
import Mention, { MentionOptions } from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import {
  Editor,
  EditorContent,
  Extension,
  mergeAttributes,
  ReactNodeViewRenderer,
  ReactRenderer,
  useEditor,
} from "@tiptap/react";
import MentionList from "./mention-list.js";
import tippy from "tippy.js";
import { PiMentionNodeView } from "./mention-node-view.js";
import { getTrimmedHTML } from "@/helpers/common.js";
import { EnterKeyExtension } from "./extensions/enter-key-extension.js";
import { cn } from "@plane/utils";

interface IItem {
  id: string;
  label: string;
  entity_name: string;
  entity_identifier: string;
  target: string;
  redirect_uri: string;
  name?: string;
  project__identifier?: string;
  sequence_id?: string;
  title: string;
  subTitle: string | undefined;
}

export interface IMentions {
  [key: string]: Partial<IItem>[] | undefined;
}
type PiChatEditorProps = {
  setEditorCommand?: (command: any) => void;
  mentionSuggestions?: (query: string) => Promise<any>;
  handleSubmit?: (e?: any) => void;
  editable?: boolean;
  content?: string;
  editorClass?: string;
};

interface CustomMentionOptions extends MentionOptions {
  mentionHighlights: () => Promise<string[]>;
  readonly?: boolean;
}
export const PiChatEditor = (props: PiChatEditorProps) => {
  const {
    setEditorCommand,
    mentionSuggestions,
    editable = true,
    content = "<p></p>",
    handleSubmit,
    editorClass = "",
  } = props;
  const editor = useEditor({
    editable,
    extensions: [
      EnterKeyExtension(handleSubmit),
      Document,
      Paragraph,
      Text,
      Mention.extend<CustomMentionOptions>({
        addStorage(this) {
          return {
            mentionsOpen: false,
          };
        },
        addAttributes() {
          return {
            id: {
              default: null,
            },
            label: {
              default: null,
            },
            target: {
              default: null,
            },
            self: {
              default: false,
            },
            redirect_uri: {
              default: "/",
            },
            entity_identifier: {
              default: null,
            },
            entity_name: {
              default: null,
            },
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(PiMentionNodeView);
        },
        parseHTML() {
          return [
            {
              tag: "mention-component",
            },
          ];
        },
        renderHTML({ HTMLAttributes }) {
          return ["mention-component", mergeAttributes(HTMLAttributes)];
        },
      }).configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: {
          items: async ({ query }) => {
            const response = await mentionSuggestions?.(query);
            return response;
          },
          render: () => {
            let component;
            let popup;

            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }
                // @ts-expect-error types are incorrect
                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },

              onUpdate(props) {
                component.updateProps(props);

                if (!props.clientRect) {
                  return;
                }

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props) {
                if (props.event.key === "Escape") {
                  popup[0].hide();

                  return true;
                }

                return component.ref?.onKeyDown(props);
              },

              onExit() {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
      }),
      Paragraph.configure({
        HTMLAttributes: {
          class: `text-[14px] leading-5 font-normal ${editorClass}`,
        },
      }),
      Extension.create({
        onUpdate(this) {
          // The content has changed.
          setEditorCommand?.({
            getHTML: () => getTrimmedHTML(this.editor?.getHTML()),
            clear: () => this.editor?.commands.clearContent(),
          });
        },
      }),
    ],
    content: content,
  });

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn("w-full m-auto text-base", {
        "max-h-[185px] overflow-y-scroll": editable,
      })}
    >
      <EditorContent editor={editor} />
    </div>
  );
};
