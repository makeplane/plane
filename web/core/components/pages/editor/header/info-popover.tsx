import { useState } from "react";
import { usePopper } from "react-popper";
import { Info } from "lucide-react";
// plane editor
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/editor";
// helpers
import { getReadTimeFromWordsCount } from "@/helpers/date-time.helper";

type Props = {
  editorRef: EditorRefApi | EditorReadOnlyRefApi | null;
};

export const PageInfoPopover: React.FC<Props> = (props) => {
  const { editorRef } = props;
  // states
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  // refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper-js
  const { styles: infoPopoverStyles, attributes: infoPopoverAttributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
  });

  const documentsInfo = editorRef?.getDocumentInfo() || { words: 0, characters: 0, paragraphs: 0 };

  const secondsToReadableTime = () => {
    const wordsCount = documentsInfo.words;
    const readTimeInSeconds = Number(getReadTimeFromWordsCount(wordsCount).toFixed(0));
    return readTimeInSeconds < 60 ? `${readTimeInSeconds}s` : `${Math.ceil(readTimeInSeconds / 60)}m`;
  };

  const documentInfoCards = [
    {
      key: "words-count",
      title: "Words",
      info: documentsInfo.words,
    },
    {
      key: "characters-count",
      title: "Characters",
      info: documentsInfo.characters,
    },
    {
      key: "paragraphs-count",
      title: "Paragraphs",
      info: documentsInfo.paragraphs,
    },
    {
      key: "read-time",
      title: "Read time",
      info: secondsToReadableTime(),
    },
  ];

  return (
    <div onMouseEnter={() => setIsPopoverOpen(true)} onMouseLeave={() => setIsPopoverOpen(false)}>
      <button type="button" ref={setReferenceElement} className="block">
        <Info className="size-3.5" />
      </button>
      {isPopoverOpen && (
        <div
          className="z-10 w-64 rounded border-[0.5px] border-custom-border-200 bg-custom-background-100 p-2 shadow-custom-shadow-rg grid grid-cols-2 gap-1.5"
          ref={setPopperElement}
          style={infoPopoverStyles.popper}
          {...infoPopoverAttributes.popper}
        >
          {documentInfoCards.map((card) => (
            <div key={card.key} className="p-2 bg-custom-background-90 rounded">
              <h6 className="text-base font-semibold">{card.info}</h6>
              <p className="mt-1.5 text-sm text-custom-text-300">{card.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
