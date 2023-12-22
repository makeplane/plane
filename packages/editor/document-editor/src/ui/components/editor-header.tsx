import { Editor } from "@tiptap/react";
import { Archive, RefreshCw, Lock } from "lucide-react";
import { IMarking, DocumentDetails } from "src/types/editor-types";
import { FixedMenu } from "src/ui/menu";
import { UploadImage } from "@plane/editor-core";
import { AlertLabel } from "src/ui/components/alert-label";
import { IVerticalDropdownItemProps, VerticalDropdownMenu } from "src/ui/components/vertical-dropdown-menu";
import { SummaryPopover } from "src/ui/components/summary-popover";
import { InfoPopover } from "src/ui/components/info-popover";

interface IEditorHeader {
  editor: Editor;
  KanbanMenuOptions: IVerticalDropdownItemProps[];
  sidePeekVisible: boolean;
  setSidePeekVisible: (sidePeekState: boolean) => void;
  markings: IMarking[];
  isLocked: boolean;
  isArchived: boolean;
  archivedAt?: Date;
  readonly: boolean;
  uploadFile?: UploadImage;
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void;
  documentDetails: DocumentDetails;
  isSubmitting?: "submitting" | "submitted" | "saved";
}

export const EditorHeader = (props: IEditorHeader) => {
  const {
    documentDetails,
    archivedAt,
    editor,
    sidePeekVisible,
    readonly,
    setSidePeekVisible,
    markings,
    uploadFile,
    setIsSubmitting,
    KanbanMenuOptions,
    isArchived,
    isLocked,
    isSubmitting,
  } = props;

  return (
    <div className="flex items-center border-b border-custom-border-200 px-5 py-2">
      <div className="w-56 flex-shrink-0 lg:w-72">
        <SummaryPopover
          editor={editor}
          markings={markings}
          sidePeekVisible={sidePeekVisible}
          setSidePeekVisible={setSidePeekVisible}
        />
      </div>

      <div className="flex-shrink-0">
        {!readonly && uploadFile && (
          <FixedMenu editor={editor} uploadFile={uploadFile} setIsSubmitting={setIsSubmitting} />
        )}
      </div>

      <div className="flex flex-grow items-center justify-end gap-3">
        {isLocked && (
          <AlertLabel
            Icon={Lock}
            backgroundColor="bg-custom-background-80"
            textColor="text-custom-text-300"
            label="Locked"
          />
        )}
        {isArchived && archivedAt && (
          <AlertLabel
            Icon={Archive}
            backgroundColor="bg-blue-500/20"
            textColor="text-blue-500"
            label={`Archived at ${new Date(archivedAt).toLocaleString()}`}
          />
        )}

        {!isLocked && !isArchived ? (
          <div
            className={`absolute right-[120px] flex items-center gap-x-2 transition-all duration-300 ${
              isSubmitting === "saved" ? "fadeOut" : "fadeIn"
            }`}
          >
            {isSubmitting !== "submitted" && isSubmitting !== "saved" && (
              <RefreshCw className="h-4 w-4 stroke-custom-text-300" />
            )}
            <span className="text-sm text-custom-text-300">
              {isSubmitting === "submitting" ? "Saving..." : "Saved"}
            </span>
          </div>
        ) : null}
        {!isArchived && <InfoPopover documentDetails={documentDetails} />}
        <VerticalDropdownMenu items={KanbanMenuOptions} />
      </div>
    </div>
  );
};
