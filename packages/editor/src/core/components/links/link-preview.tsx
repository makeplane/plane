import { Copy, GlobeIcon, Link2Off, PencilIcon } from "lucide-react";
// components
import { LinkViewProps, LinkViews } from "@/components/links";

export const LinkPreview = ({
  viewProps,
  switchView,
}: {
  viewProps: LinkViewProps;
  switchView: (view: LinkViews) => void;
}) => {
  const { editor, from, to, url } = viewProps;

  const removeLink = () => {
    editor.view.dispatch(editor.state.tr.removeMark(from, to, editor.schema.marks.link));
    viewProps.closeLinkView();
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(url);
    viewProps.closeLinkView();
  };

  return (
    <div
      className="absolute left-0 top-0 max-w-max animate-in fade-in translate-y-1"
      style={{
        transition: "all 0.2s cubic-bezier(.55, .085, .68, .53)",
      }}
    >
      <div className="shadow-md items-center rounded p-2 flex gap-3 bg-custom-background-90 border-custom-border-100 border-2 text-custom-text-300 text-xs">
        <GlobeIcon size={14} className="inline-block" />
        <p>{url?.length > 40 ? url.slice(0, 40) + "..." : url}</p>
        <div className="flex gap-2">
          <button onClick={copyLinkToClipboard} className="cursor-pointer hover:text-custom-text-100 transition-colors">
            <Copy size={14} className="inline-block" />
          </button>
          {editor.isEditable && (
            <>
              <button
                onClick={() => switchView("LinkEditView")}
                className="cursor-pointer hover:text-custom-text-100 transition-colors"
              >
                <PencilIcon size={14} className="inline-block" />
              </button>
              <button onClick={removeLink} className="cursor-pointer hover:text-custom-text-100 transition-colors">
                <Link2Off size={14} className="inline-block" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
