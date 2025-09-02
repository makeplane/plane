import { find } from "linkifyjs";
import { type CSSProperties, useState, useRef, useEffect } from "react";
// plane imports
// import { useTranslation } from "@plane/i18n";
import { Input, Button } from "@plane/ui";
import { cn } from "@plane/utils";
// helpers
import { getExtensionStorage } from "@/helpers/get-extension-storage";
// constants
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// types
import { EExternalEmbedAttributeNames } from "@/plane-editor/types/external-embed";
import { ExternalEmbedNodeViewProps } from "@/types";

type ExternalEmbedInputViewProps = {
  style: CSSProperties;
  setIsOpen: (isOpen: boolean) => void;
  externalEmbedProps: ExternalEmbedNodeViewProps;
};

export const ExternalEmbedInputView: React.FC<ExternalEmbedInputViewProps> = ({
  style: _style,
  setIsOpen,
  externalEmbedProps,
}) => {
  // states
  const [url, setUrl] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState(false);
  // refs
  const inputRef = useRef<HTMLInputElement>(null);

  // translation
  // const { t } = useTranslation();

  // effects
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // handlers
  const handleEmbedClick = () => {
    setError(false);
    const link = find(url);
    const { selection } = externalEmbedProps.editor.state;
    const { from, to } = selection;
    if (link && link.length > 0 && link[0]?.href) {
      externalEmbedProps.editor
        .chain()
        .insertExternalEmbed({
          [EExternalEmbedAttributeNames.SOURCE]: link[0].href,
          [EExternalEmbedAttributeNames.IS_RICH_CARD]: false,
          pos: { from, to },
        })
        .run();
      setIsOpen(false);
      const ExternalEmbedExtensionStorage = getExtensionStorage(
        externalEmbedProps.editor,
        ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED
      );
      ExternalEmbedExtensionStorage.openInput = false;
    } else {
      setError(true);
    }
  };

  return (
    <div
      className="bg-custom-background-90 border border-custom-border-300 rounded-md p-3 pt-1 shadow-lg z-[9999]"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="flex flex-col items-start">
        {error ? (
          <p className="text-red-500 text-xs my-1">
            Please enter a valid URL.
            {/* {t("externalEmbedComponent.error.not_valid_link")} */}
          </p>
        ) : (
          <p className="text-xs text-custom-text-300 my-1">
            Works with YouTube, Figma, Google Docs and more
            {/* {t("externalEmbedComponent.input_modal.works_with_links")} */}
          </p>
        )}

        <div className="flex gap-2 w-full h-7 ">
          <Input
            ref={inputRef}
            className={cn("w-full min-w-[250px] focus:outline-none focus:ring-1 focus:ring-custom-primary-200", {
              "border-red-500 focus:ring-red-500": error,
              "border-custom-border-300 focus:ring-custom-primary-200": !error,
            })}
            placeholder="Enter or paste a link"
            // placeholder={t("externalEmbedComponent.placeholder.link")}
            value={url}
            type="url"
            inputSize="sm"
            hasError={!!error}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onFocus={(e) => {
              e.stopPropagation();
            }}
            onChange={(e) => {
              setUrl(e.target.value);
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                e.preventDefault();
                handleEmbedClick();
              }
            }}
            mode="primary"
          />

          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEmbedClick();
            }}
          >
            Embed
            {/* {t("externalEmbedComponent.input_modal.embed")} */}
          </Button>
        </div>
      </div>
    </div>
  );
};
