// store
import { TPageInstance } from "@/store/pages/base-page";
import { PageContentBrowser } from "../../editor";

type Props = {
  page: TPageInstance;
};

export const PageNavigationPaneOutlineTabPanel: React.FC<Props> = (props) => {
  const { page } = props;
  // derived values
  const { editorRef } = page;

  return (
    <div className="mt-3 space-y-1">
      <PageContentBrowser className="mt-0" editorRef={editorRef} />
    </div>
  );
};
