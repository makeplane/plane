"use client";

import { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { Globe2, Link, Lock, Pencil, Trash2 } from "lucide-react";
// plane imports
import { EIssueCommentAccessSpecifier } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TIssueComment, TCommentsOperations } from "@plane/types";
import { CustomMenu, TContextMenuItem } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useUser } from "@/hooks/store";

type TCommentCard = {
  activityOperations: TCommentsOperations;
  comment: TIssueComment;
  setEditMode: () => void;
  showAccessSpecifier: boolean;
  showCopyLinkOption: boolean;
};

export const CommentQuickActions: FC<TCommentCard> = observer((props) => {
  const { activityOperations, comment, setEditMode, showAccessSpecifier, showCopyLinkOption } = props;
  // store hooks
  const { data: currentUser } = useUser();
  // derived values
  const isAuthor = currentUser?.id === comment.actor;
  const canEdit = isAuthor;
  const canDelete = isAuthor;
  // translation
  const { t } = useTranslation();

  const MENU_ITEMS: TContextMenuItem[] = useMemo(
    () => [
      {
        key: "edit",
        action: setEditMode,
        title: t("common.actions.edit"),
        icon: Pencil,
        shouldRender: canEdit,
      },
      {
        key: "copy_link",
        action: () => activityOperations.copyCommentLink(comment.id),
        title: t("common.actions.copy_link"),
        icon: Link,
        shouldRender: showCopyLinkOption,
      },
      {
        key: "access_specifier",
        action: () =>
          activityOperations.updateComment(comment.id, {
            access:
              comment.access === EIssueCommentAccessSpecifier.INTERNAL
                ? EIssueCommentAccessSpecifier.EXTERNAL
                : EIssueCommentAccessSpecifier.INTERNAL,
          }),
        title:
          comment.access === EIssueCommentAccessSpecifier.INTERNAL
            ? t("issue.comments.switch.public")
            : t("issue.comments.switch.private"),
        icon: comment.access === EIssueCommentAccessSpecifier.INTERNAL ? Globe2 : Lock,
        shouldRender: showAccessSpecifier,
      },
      {
        key: "delete",
        action: () => activityOperations.removeComment(comment.id),
        title: t("common.actions.delete"),
        icon: Trash2,
        shouldRender: canDelete,
      },
    ],
    [activityOperations, canDelete, canEdit, comment, setEditMode, showAccessSpecifier, showCopyLinkOption]
  );

  return (
    <CustomMenu ellipsis closeOnSelect>
      {MENU_ITEMS.map((item) => {
        if (item.shouldRender === false) return null;

        return (
          <CustomMenu.MenuItem
            key={item.key}
            onClick={() => item.action()}
            className={cn(
              "flex items-center gap-2",
              {
                "text-custom-text-400": item.disabled,
              },
              item.className
            )}
            disabled={item.disabled}
          >
            {item.icon && <item.icon className={cn("shrink-0 size-3", item.iconClassName)} />}
            <div>
              <h5>{item.title}</h5>
              {item.description && (
                <p
                  className={cn("text-custom-text-300 whitespace-pre-line", {
                    "text-custom-text-400": item.disabled,
                  })}
                >
                  {item.description}
                </p>
              )}
            </div>
          </CustomMenu.MenuItem>
        );
      })}
    </CustomMenu>
  );
});
