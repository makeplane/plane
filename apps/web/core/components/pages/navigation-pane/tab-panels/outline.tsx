// plane web imports
import { PageNavigationPaneOutlineTabEmptyState } from "@/plane-web/components/pages/navigation-pane/tab-panels/empty-states/outline";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageContentBrowser } from "../../editor/summary";

type Props = {
  page: TPageInstance;
};

export function PageNavigationPaneOutlineTabPanel(props: Props) {
  const { page } = props;
  // derived values
  const {
    editor: { editorRef },
  } = page;

  return (
    <div className="size-full overflow-y-auto vertical-scrollbar scrollbar-sm">
        <div className="mt-3">
          <PageContentBrowser
            className="mt-0"
            editorRef={editorRef}
            emptyState={<PageNavigationPaneOutlineTabEmptyState />}
          />
        </div>
    </div>
  );
}
