import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TDocumentInfo } from "@plane/editor";
import { getReadTimeFromWordsCount } from "@plane/utils";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

const DEFAULT_DOCUMENT_INFO: TDocumentInfo = {
  words: 0,
  characters: 0,
  paragraphs: 0,
};

export const PageNavigationPaneInfoTabDocumentInfo: React.FC<Props> = observer((props) => {
  const { page } = props;
  // states
  const [documentInfo, setDocumentInfo] = useState<TDocumentInfo>(DEFAULT_DOCUMENT_INFO);
  // derived values
  const { editorRef } = page;
  // subscribe to asset changes
  useEffect(() => {
    const unsubscribe = editorRef?.onDocumentInfoChange(setDocumentInfo);
    // for initial render of this component to get the editor assets
    setDocumentInfo(editorRef?.getDocumentInfo() ?? DEFAULT_DOCUMENT_INFO);
    return () => {
      unsubscribe?.();
    };
  }, [editorRef]);

  const secondsToReadableTime = useCallback(() => {
    const wordsCount = documentInfo.words;
    const readTimeInSeconds = Number(getReadTimeFromWordsCount(wordsCount).toFixed(0));
    return readTimeInSeconds < 60 ? `${readTimeInSeconds}s` : `${Math.ceil(readTimeInSeconds / 60)}m`;
  }, [documentInfo.words]);

  const documentInfoCards = useMemo(
    () => [
      {
        key: "words-count",
        title: "Words",
        info: documentInfo.words,
      },
      {
        key: "characters-count",
        title: "Characters",
        info: documentInfo.characters,
      },
      {
        key: "paragraphs-count",
        title: "Paragraphs",
        info: documentInfo.paragraphs,
      },
      {
        key: "read-time",
        title: "Read time",
        info: secondsToReadableTime(),
      },
    ],
    [documentInfo, secondsToReadableTime]
  );

  return (
    <div className="grid grid-cols-2 gap-2">
      {documentInfoCards.map((card) => (
        <div key={card.key} className="p-2 bg-custom-background-90 rounded">
          <h6 className="text-base font-semibold">{card.info}</h6>
          <p className="mt-1.5 text-sm text-custom-text-300 font-medium">{card.title}</p>
        </div>
      ))}
    </div>
  );
});
