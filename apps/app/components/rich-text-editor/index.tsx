import { useCallback, FC, useEffect, useState } from "react";
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
  FontSizeExtension,
} from "remirror/extensions";
import {
  Remirror,
  useRemirror,
  EditorComponent,
  OnChangeJSON,
  TableComponents,
  useRemirrorContext,
  ReactComponentExtension,
} from "@remirror/react";
import { tableControllerPluginKey, TableExtension } from "@remirror/extension-react-tables";
// components`
import { RichTextToolbar } from "./toolbar";
import { MentionAutoComplete } from "./mention-autocomplete";
import fileService from "lib/services/file.service";
import { Spinner } from "ui";

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
  showToolbar?: boolean;
}

const RemirrorRichTextEditor: FC<IRemirrorRichTextEditor> = ({
  placeholder,
  mentions = [],
  tags = [],
  onChange,
  value = "",
  showToolbar = true,
}) => {
  const [imageLoader, setImageLoader] = useState(false);

  // remirror error handler
  const onError: InvalidContentHandler = useCallback(
    ({ json, invalidContent, transformers }: any) => {
      // Automatically remove all invalid nodes and marks.
      return transformers.remove(json, invalidContent);
    },
    []
  );

  const uploadImageHandler = (value: any): any => {
    setImageLoader(true);

    try {
      const formData = new FormData();
      formData.append("asset", value[0].file);
      formData.append("attributes", JSON.stringify({}));

      setImageLoader(true);

      return [
        () => {
          return new Promise(async (resolve, reject) => {
            const imageUrl = await fileService.uploadFile(formData).then((response) => {
              return response.asset;
            });

            resolve({
              align: "left",
              alt: "Not Found",
              height: "100%",
              width: "100%",
              src: imageUrl,
            });

            setImageLoader(false);
          });
        },
      ];
    } catch {
      return [];
    }
  };

  // remirror manager
  const { manager, state } = useRemirror({
    extensions: () => [
      new BoldExtension(),
      new ItalicExtension(),
      new UnderlineExtension(),
      new HeadingExtension({ levels: [1, 2, 3] }),
      new FontSizeExtension({ defaultSize: "16", unit: "px" }),
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
        uploadHandler: uploadImageHandler,
      }),
      new DropCursorExtension(),
      new StrikeExtension(),
      new MentionAtomExtension({
        matchers: [
          { name: "at", char: "@" },
          { name: "tag", char: "#" },
        ],
      }),
      new TableExtension(),
    ],
    content: value,
    selection: "start",
    stringHandler: "html",
    onError,
  });

  // useEffect(() => {
  //   manager.view.updateState(manager.createState({ content: value }));
  // }, [manager, value]);

  return (
    <div className="mt-2 mb-4">
      <Remirror manager={manager} initialContent={state} classNames={["p-4 focus:outline-none"]}>
        <div className="rounded-md border">
          {showToolbar && (
            <div className="box-border w-full border-b py-2">
              <RichTextToolbar />
            </div>
          )}
          <EditorComponent />
          {imageLoader && (
            <div className="p-4">
              <Spinner />
            </div>
          )}
          {/* <TableComponents /> */}
          <MentionAutoComplete mentions={mentions} tags={tags} />
          <OnChangeJSON onChange={onChange} />
        </div>
      </Remirror>
    </div>
  );
};

export default RemirrorRichTextEditor;
