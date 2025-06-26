// plane web imports
import { PageNavigationPaneOutlineTabEmptyState } from "@/plane-web/components/pages/navigation-pane/tab-panels/empty-states/outline";
// store
import { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageContentBrowser } from "../../editor";

type Props = {
  page: TPageInstance;
};

export const PageNavigationPaneOutlineTabPanel: React.FC<Props> = (props) => {
  const { page } = props;
  // derived values
  const {
    editor: { editorRef },
  } = page;

  return (
    <div className="size-full pt-3 space-y-1">
      <PageContentBrowser
        className="mt-0"
        editorRef={editorRef}
        emptyState={<PageNavigationPaneOutlineTabEmptyState />}
      />
    </div>
  );
};
