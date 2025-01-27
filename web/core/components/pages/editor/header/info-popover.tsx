import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePopper } from "react-popper";
import { Info } from "lucide-react";
// plane editor
import { EditorRefApi } from "@plane/editor";
// plane ui
import { Avatar } from "@plane/ui";
// plane utils
import { getFileURL, renderFormattedDate } from "@plane/utils";
// helpers
import { getReadTimeFromWordsCount } from "@/helpers/date-time.helper";
// hooks
import { useMember } from "@/hooks/store";
// store types
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  editorRef: EditorRefApi | null;
  page: TPageInstance;
};

export const PageInfoPopover: React.FC<Props> = (props) => {
  const { editorRef, page } = props;
  // states
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  // refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // router
  const { workspaceSlug } = useParams();
  // popper-js
  const { styles: infoPopoverStyles, attributes: infoPopoverAttributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
  });
  // store hooks
  const { getUserDetails } = useMember();
  // derived values
  const editorInformation = page.updated_by ? getUserDetails(page.updated_by) : undefined;
  const creatorInformation = page.created_by ? getUserDetails(page.created_by) : undefined;

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
          className="z-10 w-64 rounded border-[0.5px] border-custom-border-200 bg-custom-background-100 p-2 shadow-custom-shadow-rg"
          ref={setPopperElement}
          style={infoPopoverStyles.popper}
          {...infoPopoverAttributes.popper}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {documentInfoCards.map((card) => (
              <div key={card.key} className="p-2 bg-custom-background-90 rounded">
                <h6 className="text-base font-semibold">{card.info}</h6>
                <p className="mt-1.5 text-sm text-custom-text-300">{card.title}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 mt-3">
            <div>
              <p className="text-xs font-medium text-custom-text-300">Edited by</p>
              <Link
                href={`/${workspaceSlug?.toString()}/profile/${page.updated_by}`}
                className="mt-2 flex items-center gap-1.5 text-sm font-medium"
              >
                <Avatar
                  src={getFileURL(editorInformation?.avatar_url ?? "")}
                  name={editorInformation?.display_name}
                  className="flex-shrink-0"
                  size="sm"
                />
                <span>
                  {editorInformation?.display_name}{" "}
                  <span className="text-custom-text-300">{renderFormattedDate(page.updated_at)}</span>
                </span>
              </Link>
            </div>
            <div>
              <p className="text-xs font-medium text-custom-text-300">Created by</p>
              <Link
                href={`/${workspaceSlug?.toString()}/profile/${page.created_by}`}
                className="mt-2 flex items-center gap-1.5 text-sm font-medium"
              >
                <Avatar
                  src={getFileURL(creatorInformation?.avatar_url ?? "")}
                  name={creatorInformation?.display_name}
                  className="flex-shrink-0"
                  size="sm"
                />
                <span>
                  {creatorInformation?.display_name}{" "}
                  <span className="text-custom-text-300">{renderFormattedDate(page.created_at)}</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
