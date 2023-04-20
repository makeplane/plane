import { useCallback, FC, useState, useEffect } from "react";
import { useRouter } from "next/router";
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
  OnChangeHTML,
} from "@remirror/react";
import { TableExtension } from "@remirror/extension-react-tables";
// tlds
import tlds from "tlds";
// services
import fileService from "services/file.service";
// ui
import { Spinner } from "components/ui";
// components
import { CustomFloatingToolbar } from "./toolbar/float-tool-tip";
import { MentionAutoComplete } from "./mention-autocomplete";

export interface IRemirrorRichTextEditor {
  placeholder?: string;
  mentions?: any[];
  tags?: any[];
  onBlur?: (jsonValue: any, htmlValue: any) => void;
  onJSONChange?: (jsonValue: any) => void;
  onHTMLChange?: (htmlValue: any) => void;
  value?: any;
  showToolbar?: boolean;
  editable?: boolean;
  customClassName?: string;
  gptOption?: boolean;
  noBorder?: boolean;
  borderOnFocus?: boolean;
}

// eslint-disable-next-line no-duplicate-imports
import { FloatingWrapper, FloatingToolbar } from "@remirror/react";

const RemirrorRichTextEditor: FC<IRemirrorRichTextEditor> = (props) => {
  const {
    placeholder,
    mentions = [],
    tags = [],
    onBlur = () => {},
    onJSONChange = () => {},
    onHTMLChange = () => {},
    value = "",
    showToolbar = true,
    editable = true,
    customClassName,
    gptOption = false,
    noBorder = false,
    borderOnFocus = true,
  } = props;

  const [imageLoader, setImageLoader] = useState(false);
  const [jsonValue, setJsonValue] = useState<any>();
  const [htmlValue, setHtmlValue] = useState<any>();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  // remirror error handler
  const onError: InvalidContentHandler = useCallback(
    ({ json, invalidContent, transformers }: any) =>
      // Automatically remove all invalid nodes and marks.
      transformers.remove(json, invalidContent),
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
        () =>
          new Promise(async (resolve, reject) => {
            const imageUrl = await fileService
              .uploadFile(workspaceSlug as string, formData)
              .then((response) => response.asset);

            resolve({
              align: "left",
              alt: "Not Found",
              height: "100%",
              width: "100%",
              src: imageUrl,
            });
            setImageLoader(false);
          }),
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
      new PlaceholderExtension({ placeholder: placeholder || "Enter text..." }),
      new HistoryExtension(),
      new LinkExtension({
        autoLink: true,
        autoLinkAllowedTLDs: tlds,
      }),
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
    content: !value || (typeof value === "object" && Object.keys(value).length === 0) ? "" : value,
    selection: "start",
    stringHandler: "html",
    onError,
  });

  const updateState = useCallback(
    (value: any) => {
      manager.view.updateState(
        manager.createState({
          content:
            !value || (typeof value === "object" && Object.keys(value).length === 0) ? "" : value,
          selection: value === "" ? "start" : manager.view.state.selection,
        })
      );
    },
    [manager]
  );

  useEffect(() => {
    updateState(value);
  }, [updateState, value]);

  const handleJSONChange = (json: any) => {
    setJsonValue(json);
    onJSONChange(json);
  };

  const handleHTMLChange = (value: string) => {
    setHtmlValue(value);
    onHTMLChange(value);
  };

  return (
    <div className="relative">
      <Remirror
        manager={manager}
        initialContent={state}
        classNames={[
          `p-4 relative focus:outline-none rounded-md focus:border-brand-base ${
            noBorder ? "" : "border border-brand-base"
          } ${
            borderOnFocus ? "focus:border border-brand-base" : "focus:border-0"
          } ${customClassName}`,
        ]}
        editable={editable}
        onBlur={() => {
          onBlur(jsonValue, htmlValue);
        }}
      >
        {(!value || value === "" || value?.content?.[0]?.content === undefined) &&
          !(typeof value === "string" && value.includes("<")) &&
          placeholder && (
            <p className="pointer-events-none absolute top-4 left-4 text-sm">{placeholder}</p>
          )}
        <EditorComponent />

        {imageLoader && (
          <div className="p-4">
            <Spinner />
          </div>
        )}

        {editable && (
          <FloatingWrapper
            positioner="always"
            floatingLabel="Custom Floating Toolbar"
            renderOutsideEditor
          >
            <FloatingToolbar className="z-[9999] overflow-hidden rounded">
              <CustomFloatingToolbar gptOption={gptOption} editorState={state} />
            </FloatingToolbar>
          </FloatingWrapper>
        )}

        <MentionAutoComplete mentions={mentions} tags={tags} />
        {<OnChangeJSON onChange={handleJSONChange} />}
        {<OnChangeHTML onChange={handleHTMLChange} />}
      </Remirror>
    </div>
  );
};

export default RemirrorRichTextEditor;
