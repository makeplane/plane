import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";

import { useTranslation } from "@plane/i18n";
import { LinkIcon, NewTabIcon, EditIcon, TrashIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TContextMenuItem } from "@plane/ui";
import { LinkItemBlock } from "@plane/ui";
// plane utils
import { copyTextToClipboard } from "@plane/utils";
// hooks
import { useHome } from "@/hooks/store/use-home";
// types
import type { TLinkOperations } from "./use-links";

export type TProjectLinkDetail = {
  linkId: string;
  linkOperations: TLinkOperations;
};

export const ProjectLinkDetail = observer(function ProjectLinkDetail(props: TProjectLinkDetail) {
  // props
  const { linkId, linkOperations } = props;
  // hooks
  const {
    quickLinks: { getLinkById, toggleLinkModal, setLinkData },
  } = useHome();
  const { t } = useTranslation();
  // derived values
  const linkDetail = getLinkById(linkId);
  const linkUrl = linkDetail?.url;

  // handlers
  const handleEdit = useCallback(
    (modalToggle: boolean) => {
      toggleLinkModal(modalToggle);
      setLinkData(linkDetail);
    },
    [linkDetail, setLinkData, toggleLinkModal]
  );

  const handleCopyText = useCallback(() => {
    if (!linkUrl) return;
    copyTextToClipboard(linkUrl).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("link_copied"),
        message: t("view_link_copied_to_clipboard"),
      });
    });
  }, [linkUrl, t]);

  const handleOpenInNewTab = useCallback(() => {
    window.open(linkUrl, "_blank", "noopener,noreferrer");
  }, [linkUrl]);

  const handleDelete = useCallback(() => {
    linkOperations.remove(linkId);
  }, [linkId, linkOperations]);

  // derived values
  const menuItems = useMemo<TContextMenuItem[]>(
    () => [
      {
        key: "edit",
        action: () => handleEdit(true),
        title: t("edit"),
        icon: EditIcon,
      },
      {
        key: "open-new-tab",
        action: handleOpenInNewTab,
        title: t("open_in_new_tab"),
        icon: NewTabIcon,
      },
      {
        key: "copy-link",
        action: handleCopyText,
        title: t("copy_link"),
        icon: LinkIcon,
      },
      {
        key: "delete",
        action: handleDelete,
        title: t("delete"),
        icon: TrashIcon,
      },
    ],
    [handleEdit, handleOpenInNewTab, handleCopyText, handleDelete, t]
  );

  if (!linkDetail) return null;

  return (
    <LinkItemBlock
      title={linkDetail.title || linkDetail.url}
      url={linkDetail.url}
      createdAt={linkDetail.created_at}
      menuItems={menuItems}
      onClick={handleOpenInNewTab}
    />
  );
});
