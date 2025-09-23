import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePopper } from "react-popper";
import { Info } from "lucide-react";
// plane imports
import { Avatar } from "@plane/ui";
import { getFileURL, renderFormattedDate } from "@plane/utils";
// helpers
import { calculateTimeAgoShort, getReadTimeFromWordsCount } from "@/helpers/date-time.helper";
// hooks
import { useMember } from "@/hooks/store";
// store types
import { type TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageInfoPopover: React.FC<Props> = observer((props) => {
  const { page } = props;
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
  const creatorInformation = page.owned_by ? getUserDetails(page.owned_by) : undefined;

  const documentsInfo = page.editorRef?.getDocumentInfo() || { words: 0, characters: 0, paragraphs: 0 };

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
    <div
      className="flex-shrink-0"
      onMouseEnter={() => setIsPopoverOpen(true)}
      onMouseLeave={() => setIsPopoverOpen(false)}
    >
      <button
        type="button"
        ref={setReferenceElement}
        className="size-6 grid place-items-center rounded text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors"
      >
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
                  <span className="text-custom-text-300">{calculateTimeAgoShort(page.updated_at ?? "")} ago</span>
                </span>
              </Link>
            </div>
            <div>
              <p className="text-xs font-medium text-custom-text-300">Created by</p>
              <Link
                href={`/${workspaceSlug?.toString()}/profile/${page.owned_by}`}
                className="mt-2 flex items-center gap-1.5 text-sm font-medium"
              >
                <Avatar
                  src={getFileURL(creatorInformation?.avatar_url ?? "")}
                  name={creatorInformation?.display_name}
                  className="flex-shrink-0"
                  size="sm"
                />
                <span className="flex items-center gap-2 text-xs">
                  <span className="font-medium">{creatorInformation?.display_name}</span>{" "}
                  <span className="text-custom-text-300">{renderFormattedDate(page.created_at)}</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
