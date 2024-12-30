import { observer } from "mobx-react";
import { EditorRefApi } from "@plane/editor";
// components
import { Header, EHeaderVariant } from "@plane/ui";
import { PageEditorMobileHeaderRoot, PageExtraOptions, PageSummaryPopover, PageToolbar } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  editorReady: boolean;
  editorRef: React.RefObject<EditorRefApi>;
  page: TPageInstance;
  setSidePeekVisible: (sidePeekState: boolean) => void;
  sidePeekVisible: boolean;
};

export const PageEditorHeaderRoot: React.FC<Props> = observer((props) => {
  const { editorReady, editorRef, page, setSidePeekVisible, sidePeekVisible } = props;
  // derived values
  const { isContentEditable } = page;
  // page filters
  const { isFullWidth } = usePageFilters();
  // derived values
  const resolvedEditorRef = editorRef.current;

  if (!resolvedEditorRef) return null;

  return (
    <>
      <Header variant={EHeaderVariant.SECONDARY} showOnMobile={false}>
        <Header.LeftItem className="gap-0 w-full">
          {editorReady && (
            <div
              className={cn("flex-shrink-0 my-auto", {
                "w-40 lg:w-56": !isFullWidth,
                "w-[5%]": isFullWidth,
              })}
            >
              <PageSummaryPopover
                editorRef={editorRef.current}
                isFullWidth={isFullWidth}
                sidePeekVisible={sidePeekVisible}
                setSidePeekVisible={setSidePeekVisible}
              />
            </div>
          )}
          {editorReady && isContentEditable && editorRef.current && <PageToolbar editorRef={editorRef?.current} />}
        </Header.LeftItem>
        <PageExtraOptions editorRef={resolvedEditorRef} page={page} />
      </Header>
      <div className="md:hidden">
        <PageEditorMobileHeaderRoot
          editorRef={resolvedEditorRef}
          page={page}
          sidePeekVisible={sidePeekVisible}
          setSidePeekVisible={setSidePeekVisible}
        />
      </div>
    </>
  );
});
