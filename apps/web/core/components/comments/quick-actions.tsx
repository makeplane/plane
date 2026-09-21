/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import {
  DeleteOutline,
  EditOutline,
  GlobeOutline,
  LinkOutline,
  LockOutline,
  MoreHorizontalOutline,
} from "@makeplane/propel/icons";
// plane imports
import { EIssueCommentAccessSpecifier } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import type { TIssueComment, TCommentsOperations } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useUser } from "@/hooks/store/user";

type TCommentCard = {
  activityOperations: TCommentsOperations;
  comment: TIssueComment;
  setEditMode: () => void;
  showAccessSpecifier: boolean;
  showCopyLinkOption: boolean;
};

export const CommentQuickActions = observer(function CommentQuickActions(props: TCommentCard) {
  const { activityOperations, comment, setEditMode, showAccessSpecifier, showCopyLinkOption } = props;
  // store hooks
  const { data: currentUser } = useUser();
  // derived values
  const isAuthor = currentUser?.id === comment.actor;
  const canEdit = isAuthor;
  const canDelete = isAuthor;
  // translation
  const { t } = useTranslation();

  const MENU_ITEMS = useMemo(
    function MENU_ITEMS(): TContextMenuItem[] {
      return [
        {
          key: "edit",
          action: setEditMode,
          title: t("common.actions.edit"),
          icon: EditOutline,
          shouldRender: canEdit,
        },
        {
          key: "copy_link",
          action: () => activityOperations.copyCommentLink(comment.id),
          title: t("common.actions.copy_link"),
          icon: LinkOutline,
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
          icon: comment.access === EIssueCommentAccessSpecifier.INTERNAL ? GlobeOutline : LockOutline,
          shouldRender: showAccessSpecifier,
        },
        {
          key: "delete",
          action: () => activityOperations.removeComment(comment.id),
          title: t("common.actions.delete"),
          icon: DeleteOutline,
          shouldRender: canDelete,
        },
      ].filter((item) => item.shouldRender !== false);
    },
    [t, setEditMode, canEdit, showCopyLinkOption, activityOperations, comment, showAccessSpecifier, canDelete]
  );

  if (MENU_ITEMS.length === 0) return null;

  return (
    <CustomMenu customButton={<IconButton icon={MoreHorizontalOutline} variant="ghost" size="sm" />} closeOnSelect>
      {MENU_ITEMS.map((item) => (
        <CustomMenu.MenuItem
          key={item.key}
          onClick={() => item.action()}
          className={cn(
            "flex items-center gap-2",
            {
              "text-placeholder": item.disabled,
            },
            item.className
          )}
          disabled={item.disabled}
        >
          {item.icon && <item.icon className={cn("size-3 shrink-0", item.iconClassName)} />}
          <div>
            <h5>{item.title}</h5>
            {item.description && (
              <p
                className={cn("whitespace-pre-line text-tertiary", {
                  "text-placeholder": item.disabled,
                })}
              >
                {item.description}
              </p>
            )}
          </div>
        </CustomMenu.MenuItem>
      ))}
    </CustomMenu>
  );
});
