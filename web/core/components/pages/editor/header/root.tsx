import { observer } from "mobx-react";
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/editor";
// components
import { Header, EHeaderVariant } from "@plane/ui";
import { PageEditorMobileHeaderRoot, PageExtraOptions, PageSummaryPopover, PageToolbar } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";
// store
import { IPage } from "@/store/pages/page";

type Props = {
  editorReady: boolean;
  editorRef: React.RefObject<EditorRefApi>;
  page: IPage;
  readOnlyEditorReady: boolean;
  readOnlyEditorRef: React.RefObject<EditorReadOnlyRefApi>;
  setSidePeekVisible: (sidePeekState: boolean) => void;
  sidePeekVisible: boolean;
};

export const PageEditorHeaderRoot: React.FC<Props> = observer((props) => {
  const { editorReady, editorRef, page, readOnlyEditorReady, readOnlyEditorRef, setSidePeekVisible, sidePeekVisible } =
    props;
  // derived values
  const { isContentEditable } = page;
  // page filters
  const { isFullWidth } = usePageFilters();
  // derived values
  const resolvedEditorRef = isContentEditable ? editorRef.current : readOnlyEditorRef.current;

  if (!resolvedEditorRef) return null;

  return (
    <>
      <Header variant={EHeaderVariant.SECONDARY} showOnMobile={false}>
        <Header.LeftItem className="gap-0 w-full">
          {(editorReady || readOnlyEditorReady) && (
            <div
              className={cn("flex-shrink-0 my-auto", {
                "w-40 lg:w-56": !isFullWidth,
                "w-[5%]": isFullWidth,
              })}
            >
              <PageSummaryPopover
                editorRef={isContentEditable ? editorRef.current : readOnlyEditorRef.current}
                isFullWidth={isFullWidth}
                sidePeekVisible={sidePeekVisible}
                setSidePeekVisible={setSidePeekVisible}
              />
            </div>
          )}
          {(editorReady || readOnlyEditorReady) && isContentEditable && editorRef.current && (
            <PageToolbar editorRef={editorRef?.current} />
          )}
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
