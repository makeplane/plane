import { useCallback, FC } from "react";
import { InvalidContentHandler } from "remirror";
import {
  BoldExtension,
  ItalicExtension,
  CalloutExtension,
  PlaceholderExtension,
  CodeBlockExtension,
  CodeExtension,
  HistoryExtension,
  LinkExtension,
  UnderlineExtension,
  HeadingExtension,
  OrderedListExtension,
  ListItemExtension,
  BulletListExtension,
  ImageExtension,
  DropCursorExtension,
  StrikeExtension,
  MentionAtomExtension,
} from "remirror/extensions";
import { Remirror, useRemirror, EditorComponent, OnChangeJSON } from "@remirror/react";
// components`
import { RichTextToolbar } from "./toolbar";
import { MentionAutoComplete } from "./mention-autocomplete";

type SetProgress = (progress: number) => void;
interface FileWithProgress {
  file: File;
  progress: SetProgress;
}

export interface IRemirrorRichTextEditor {
  placeholder?: string;
  mentions?: any[];
  tags?: any[];
  onChange: (value: any) => void;
  value?: any;
}

const RemirrorRichTextEditor: FC<IRemirrorRichTextEditor> = ({
  placeholder,
  mentions = [],
  tags = [],
  onChange,
  value = "",
}) => {
  // remirror error handler
  const onError: InvalidContentHandler = useCallback(
    ({ json, invalidContent, transformers }: any) => {
      // Automatically remove all invalid nodes and marks.
      return transformers.remove(json, invalidContent);
    },
    []
  );
  // remirror manager
  const { manager, state } = useRemirror({
    extensions: () => [
      new BoldExtension(),
      new ItalicExtension(),
      new UnderlineExtension(),
      new HeadingExtension({ levels: [1, 2, 3] }),
      new OrderedListExtension(),
      new ListItemExtension(),
      new BulletListExtension({ enableSpine: true }),
      new CalloutExtension({ defaultType: "warn" }),
      new CodeBlockExtension(),
      new CodeExtension(),
      new PlaceholderExtension({ placeholder: placeholder || `Enter text...` }),
      new HistoryExtension(),
      new LinkExtension({ autoLink: true }),
      new ImageExtension({
        enableResizing: true,
      }),
      new DropCursorExtension(),
      new StrikeExtension(),
      new MentionAtomExtension({
        matchers: [
          { name: "at", char: "@" },
          { name: "tag", char: "#" },
        ],
      }),
    ],
    content: value,
    selection: "start",
    stringHandler: "html",
    onError,
  });

  return (
    <>
      <div className="mb-4">
        <Remirror manager={manager} initialContent={state} classNames={["p-4 focus:outline-none"]}>
          <div className="rounded-md border ">
            <div className="box-border w-full border-b px-5 py-3">
              <RichTextToolbar />
            </div>
            <EditorComponent />
            <MentionAutoComplete mentions={mentions} tags={tags} />
            <OnChangeJSON onChange={onChange} />
          </div>
        </Remirror>
      </div>
    </>
  );
};

export default RemirrorRichTextEditor;
