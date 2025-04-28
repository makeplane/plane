"use client";

import { FC, useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { Pencil, ExternalLink, Link, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast, TContextMenuItem, LinkItemBlock } from "@plane/ui";
// plane utils
import { copyTextToClipboard } from "@plane/utils";
// hooks
import { useHome } from "@/hooks/store/use-home";
// types
import { TLinkOperations } from "./use-links";

export type TProjectLinkDetail = {
  linkId: string;
  linkOperations: TLinkOperations;
};

export const ProjectLinkDetail: FC<TProjectLinkDetail> = observer((props) => {
  // props
  const { linkId, linkOperations } = props;
  // hooks
  const {
    quickLinks: { getLinkById, toggleLinkModal, setLinkData },
  } = useHome();
  const { t } = useTranslation();
  // derived values
  const linkDetail = getLinkById(linkId);

  if (!linkDetail) return null;

  // handlers
  const handleEdit = useCallback(
    (modalToggle: boolean) => {
      toggleLinkModal(modalToggle);
      setLinkData(linkDetail);
    },
    [linkDetail, setLinkData, toggleLinkModal]
  );

  const handleCopyText = useCallback(() => {
    copyTextToClipboard(linkDetail.url).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("link_copied"),
        message: t("view_link_copied_to_clipboard"),
      });
    });
  }, [linkDetail.url, t]);

  const handleOpenInNewTab = useCallback(() => {
    window.open(linkDetail.url, "_blank", "noopener,noreferrer");
  }, [linkDetail.url]);

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
        icon: Pencil,
      },
      {
        key: "open-new-tab",
        action: handleOpenInNewTab,
        title: t("open_in_new_tab"),
        icon: ExternalLink,
      },
      {
        key: "copy-link",
        action: handleCopyText,
        title: t("copy_link"),
        icon: Link,
      },
      {
        key: "delete",
        action: handleDelete,
        title: t("delete"),
        icon: Trash2,
      },
    ],
    [handleEdit, handleOpenInNewTab, handleCopyText, handleDelete, t]
  );

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
