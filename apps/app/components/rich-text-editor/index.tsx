import { useCallback, FC, useState, useEffect } from "react";
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
  OnChangeHTML,
} from "@remirror/react";
import { tableControllerPluginKey, TableExtension } from "@remirror/extension-react-tables";
// components`
import { RichTextToolbar } from "./toolbar";
import { MentionAutoComplete } from "./mention-autocomplete";
import fileService from "lib/services/file.service";
import { Spinner } from "ui";
import { useRouter } from "next/router";

export interface IRemirrorRichTextEditor {
  placeholder?: string;
  mentions?: any[];
  tags?: any[];
  onBlur: (jsonValue: any, htmlValue: any) => void;
  value?: any;
  showToolbar?: boolean;
  editable?: boolean;
}

const RemirrorRichTextEditor: FC<IRemirrorRichTextEditor> = ({
  placeholder,
  mentions = [],
  tags = [],
  onBlur,
  value = "",
  showToolbar = true,
  editable = true,
}) => {
  const [imageLoader, setImageLoader] = useState(false);
  const [jsonValue, setJsonValue] = useState<any>();
  const [htmlValue, setHtmlValue] = useState<any>();

  const router = useRouter();
  const { workspaceSlug } = router.query;

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
            const imageUrl = await fileService
              .uploadFile(workspaceSlug as string, formData)
              .then((response) => {
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

  const updateState = useCallback(
    (value: any) => {
      // Clear out old state when setting data from outside
      // This prevents e.g. the user from using CTRL-Z to go back to the old state
      manager.view.updateState(manager.createState({ content: value }));
    },
    [manager]
  );

  useEffect(() => {
    updateState(value);
  }, [updateState, value]);

  return (
    <div className="mt-2 mb-4">
      <Remirror
        manager={manager}
        initialContent={state}
        classNames={["p-4 focus:outline-none"]}
        editable={editable}
        onBlur={() => {
          onBlur(jsonValue, htmlValue);
        }}
      >
        <div className="rounded-md border">
          {showToolbar && editable && (
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
          {<OnChangeJSON onChange={setJsonValue} />}
          {<OnChangeHTML onChange={setHtmlValue} />}
        </div>
      </Remirror>
    </div>
  );
};

export default RemirrorRichTextEditor;
