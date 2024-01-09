import { CopyIcon, GlobeIcon, LinkBreak1Icon, Pencil1Icon } from "@radix-ui/react-icons";
import { LinkViewProps } from "./link-view";

export const LinkPreview = ({
  viewProps,
  switchView,
}: {
  viewProps: LinkViewProps;
  switchView: (view: "LinkPreview" | "LinkEditView" | "LinkInputView") => void;
}) => {
  const { editor, from, to, url } = viewProps;

  const removeLink = () => {
    editor.view.dispatch(editor.state.tr.removeMark(from, to, editor.schema.marks.link));
    viewProps.onActionCompleteHandler({
      title: "Link successfully removed",
      message: "The link was removed from the text.",
      type: "success",
    });
    viewProps.closeLinkView();
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(url);
    viewProps.onActionCompleteHandler({
      title: "Link successfully copied",
      message: "The link was copied to the clipboard.",
      type: "success",
    });
    viewProps.closeLinkView();
  };

  return (
    <div className="absolute left-0 top-0 max-w-max">
      <div className="shadow-md rounded p-2 flex gap-3 bg-custom-background-90 border-custom-border-100 border-2 text-custom-text-300 text-xs">
        <GlobeIcon className="inline-block" />
        <p>{url.length > 40 ? url.slice(0, 40) + "..." : url}</p>
        <div className="flex gap-2">
          <button onClick={copyLinkToClipboard} className="cursor-pointer">
            <CopyIcon className="inline-block" />
          </button>
          <button onClick={() => switchView("LinkEditView")} className="cursor-pointer">
            <Pencil1Icon className="inline-block" />
          </button>
          <button onClick={removeLink} className="cursor-pointer">
            <LinkBreak1Icon className="inline-block" />
          </button>
        </div>
      </div>
    </div>
  );
};
