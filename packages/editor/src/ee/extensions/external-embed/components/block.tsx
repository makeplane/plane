import { useEditorState } from "@tiptap/react";
import { FileCode2 } from "lucide-react";
import React, { useEffect, useRef, useState, memo, useCallback } from "react";
// plane imports
// import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// helpers
import { getExtensionStorage } from "@/helpers/get-extension-storage";
// constants
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// components
import { ExternalEmbedInputModal } from "./floating-input-modal";
import { ExternalEmbedNodeViewProps } from "@/types";
import { CORE_EXTENSIONS } from "@/constants/extension";

export const ExternalEmbedBlock: React.FC<ExternalEmbedNodeViewProps> = memo((externalEmbedProps) => {
  // states
  const [isOpen, setIsOpen] = useState(false);
  const embedButtonRef = useRef<HTMLDivElement>(null);

  const { isFlagged, onClick } = externalEmbedProps.extension.options;
  const isTouchDevice = !!getExtensionStorage(externalEmbedProps.editor, CORE_EXTENSIONS.UTILITY).isTouchDevice;
  // const { t } = useTranslation();

  // subscribe to external embed storage state
  const shouldOpenInput = useEditorState({
    editor: externalEmbedProps.editor,
    selector: ({ editor }) => {
      const storage = getExtensionStorage(editor, ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED);
      return editor.isEditable && storage.openInput;
    },
  });

  // handlers
  const handleEmbedButtonClick = useCallback(() => {
    if (isTouchDevice) {
      onClick?.();
      return;
    }
    if (externalEmbedProps.editor.isEditable) {
      return setIsOpen(true);
    }
  }, [externalEmbedProps.editor.isEditable, isTouchDevice, onClick]);

  // effects
  useEffect(() => {
    if (shouldOpenInput) {
      setIsOpen(true);
      // Reset the openInput flag using proper pattern
      const ExternalEmbedExtensionStorage = getExtensionStorage(
        externalEmbedProps.editor,
        ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED
      );
      ExternalEmbedExtensionStorage.openInput = false;
    }
  }, [shouldOpenInput, externalEmbedProps.editor]);

  return (
    <>
      <div
        ref={embedButtonRef}
        className={cn(
          "flex items-center justify-start gap-2 py-3 px-2 my-2 rounded-lg text-custom-text-300 bg-custom-background-90 border border-dashed border-custom-border-300 transition-all duration-200 ease-in-out cursor-default",
          {
            "hover:text-custom-text-200 hover:bg-custom-background-80 cursor-pointer":
              externalEmbedProps.editor.isEditable,
            "text-custom-primary-200 bg-custom-primary-100/10 border-custom-primary-200/10 hover:bg-custom-primary-100/10 hover:text-custom-primary-200":
              externalEmbedProps.selected && externalEmbedProps.editor.isEditable,
          }
        )}
        onClick={handleEmbedButtonClick}
      >
        <FileCode2 className="size-4" />

        <div className="text-base font-medium">
          {"Insert your preferred embed link here, such as YouTube video, Figma design, etc."}
          {/* {t("externalEmbedComponent.placeholder.insert_embed")} */}
        </div>

        <input className="size-0 overflow-hidden" hidden type="file" multiple />
      </div>
      <ExternalEmbedInputModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        referenceElement={embedButtonRef.current}
        externalEmbedProps={externalEmbedProps}
        isFlagged={isFlagged}
      />
    </>
  );
});
