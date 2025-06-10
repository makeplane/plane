import { observer } from "mobx-react";
// plane imports
import { getReadTimeFromWordsCount } from "@plane/utils";
// components
import { TPageRootHandlers } from "@/components/pages/editor";
// store
import { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageNavigationPaneInfoTabActorsInfo } from "./actors-info";
import { PageNavigationPaneInfoTabVersionHistory } from "./version-history";

type Props = {
  page: TPageInstance;
  versionHistory: Pick<TPageRootHandlers, "fetchAllVersions" | "fetchVersionDetails">;
};

export const PageNavigationPaneInfoTabPanel: React.FC<Props> = observer((props) => {
  const { page, versionHistory } = props;
  // derived values
  const { editorRef } = page;
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
    <div className="mt-5">
      <div className="grid grid-cols-2 gap-2">
        {documentInfoCards.map((card) => (
          <div key={card.key} className="p-2 bg-custom-background-90 rounded">
            <h6 className="text-base font-semibold">{card.info}</h6>
            <p className="mt-1.5 text-sm text-custom-text-300 font-medium">{card.title}</p>
          </div>
        ))}
      </div>
      <PageNavigationPaneInfoTabActorsInfo page={page} />
      <div className="flex-shrink-0 h-px bg-custom-background-80 my-3" />
      <PageNavigationPaneInfoTabVersionHistory page={page} versionHistory={versionHistory} />
    </div>
  );
});
