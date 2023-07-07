import { useCallback, useState, useImperativeHandle } from "react";
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
  FloatingToolbar,
  FloatingWrapper,
} from "@remirror/react";
import { TableExtension } from "@remirror/extension-react-tables";
// tlds
import tlds from "tlds";
// services
import fileService from "services/file.service";
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
  forwardedRef?: any;
}

const RemirrorRichTextEditor: React.FC<IRemirrorRichTextEditor> = (props) => {
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
    forwardedRef,
  } = props;

  const [disableToolbar, setDisableToolbar] = useState(false);

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
    try {
      const formData = new FormData();
      formData.append("asset", value[0].file);
      formData.append("attributes", JSON.stringify({}));

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
      new PlaceholderExtension({
        placeholder: placeholder || "Enter text...",
        emptyNodeClass: "empty-node",
      }),
      new HistoryExtension(),
      new LinkExtension({
        autoLink: true,
        autoLinkAllowedTLDs: tlds,
        selectTextOnClick: true,
        defaultTarget: "_blank",
      }),
      new ImageExtension({
        enableResizing: true,
        uploadHandler: uploadImageHandler,
        createPlaceholder() {
          const div = document.createElement("div");
          div.className = "w-full aspect-video bg-brand-surface-2 animate-pulse";
          return div;
        },
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

  useImperativeHandle(forwardedRef, () => ({
    clearEditor: () => {
      manager.view.updateState(manager.createState({ content: "", selection: "start" }));
    },
    setEditorValue: (value: any) => {
      manager.view.updateState(
        manager.createState({
          content: value,
          selection: "end",
        })
      );
    },
  }));

  return (
    <div className="relative">
      <Remirror
        manager={manager}
        initialContent={state}
        classNames={[
          `p-3 relative focus:outline-none rounded-md focus:border-brand-base ${
            noBorder ? "" : "border border-brand-base"
          } ${
            borderOnFocus ? "focus:border border-brand-base" : "focus:border-0"
          } ${customClassName}`,
        ]}
        editable={editable}
        onBlur={(event) => {
          const html = event.helpers.getHTML();
          const json = event.helpers.getJSON();

          setDisableToolbar(true);

          onBlur(json, html);
        }}
        onFocus={() => setDisableToolbar(false)}
      >
        <div className="prose prose-brand max-w-full prose-p:my-1">
          <EditorComponent />
        </div>

        {editable && !disableToolbar && (
          <FloatingWrapper
            positioner="always"
            renderOutsideEditor
            floatingLabel="Custom Floating Toolbar"
          >
            <FloatingToolbar className="z-50 overflow-hidden rounded">
              <CustomFloatingToolbar
                gptOption={gptOption}
                editorState={state}
                setDisableToolbar={setDisableToolbar}
              />
            </FloatingToolbar>
          </FloatingWrapper>
        )}

        <MentionAutoComplete mentions={mentions} tags={tags} />
        {<OnChangeJSON onChange={onJSONChange} />}
        {<OnChangeHTML onChange={onHTMLChange} />}
      </Remirror>
    </div>
  );
};

RemirrorRichTextEditor.displayName = "RemirrorRichTextEditor";

export default RemirrorRichTextEditor;
