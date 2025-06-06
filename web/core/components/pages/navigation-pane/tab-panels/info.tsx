import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Avatar } from "@plane/ui";
import { calculateTimeAgoShort, getFileURL, getReadTimeFromWordsCount, renderFormattedDate } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageNavigationPaneInfoTabPanel: React.FC<Props> = observer((props) => {
  const { page } = props;
  // navigation
  const { workspaceSlug } = useParams();
  // store hooks
  const { getUserDetails } = useMember();
  // derived values
  const { created_by, editorRef, updated_by } = page;
  const editorInformation = updated_by ? getUserDetails(updated_by) : undefined;
  const creatorInformation = created_by ? getUserDetails(created_by) : undefined;
  const documentsInfo = editorRef?.getDocumentInfo() || { words: 0, characters: 0, paragraphs: 0 };
  // translation
  const { t } = useTranslation();

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
            <p className="mt-1.5 text-sm text-custom-text-300">{card.title}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3 mt-4">
        <div>
          <p className="text-xs font-medium text-custom-text-300">Edited by</p>
          <div className="mt-2 flex items-center justify-between gap-2 text-sm font-medium">
            <Link href={`/${workspaceSlug?.toString()}/profile/${page.updated_by}`} className="flex items-center gap-1">
              <Avatar
                src={getFileURL(editorInformation?.avatar_url ?? "")}
                name={editorInformation?.display_name}
                className="flex-shrink-0"
                size="sm"
              />
              <span>{editorInformation?.display_name ?? t("common.deactivated_user")}</span>
            </Link>
            <span className="flex-shrink-0 text-custom-text-300">
              {calculateTimeAgoShort(page.updated_at ?? "")} ago
            </span>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-custom-text-300">{t("common.created_by")}</p>
          <div className="mt-2 flex items-center justify-between gap-2 text-sm font-medium">
            <Link href={`/${workspaceSlug?.toString()}/profile/${page.created_by}`} className="flex items-center gap-1">
              <Avatar
                src={getFileURL(creatorInformation?.avatar_url ?? "")}
                name={creatorInformation?.display_name}
                className="flex-shrink-0"
                size="sm"
              />
              <span>{creatorInformation?.display_name ?? t("common.deactivated_user")}</span>
            </Link>
            <span className="flex-shrink-0 text-custom-text-300">{renderFormattedDate(page.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
