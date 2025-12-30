import { Link2Off } from "lucide-react";
import { CopyIcon, GlobeIcon, EditIcon } from "@plane/propel/icons";
// components
import type { LinkViewProps, LinkViews } from "@/components/links";

export function LinkPreview({
  viewProps,
  switchView,
}: {
  viewProps: LinkViewProps;
  switchView: (view: LinkViews) => void;
}) {
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
      <div className="shadow-md items-center rounded-sm p-2 flex gap-3 bg-layer-1 border-subtle border-2 text-tertiary text-11">
        <GlobeIcon width={14} height={14} className="inline-block" />
        <p>{url?.length > 40 ? url.slice(0, 40) + "..." : url}</p>
        <div className="flex gap-2">
          <button onClick={copyLinkToClipboard} className="cursor-pointer hover:text-primary transition-colors">
            <CopyIcon width={14} height={14} className="inline-block" />
          </button>
          {editor.isEditable && (
            <>
              <button
                onClick={() => switchView("LinkEditView")}
                className="cursor-pointer hover:text-primary transition-colors"
              >
                <EditIcon width={14} height={14} className="inline-block" />
              </button>
              <button onClick={removeLink} className="cursor-pointer hover:text-primary transition-colors">
                <Link2Off size={14} className="inline-block" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
