import { useMemo } from "react";
import { observer } from "mobx-react";
import { MoreHorizontal } from "lucide-react";
// plane imports
import { EIssueCommentAccessSpecifier } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { LinkIcon, GlobeIcon, LockIcon, EditIcon, TrashIcon } from "@plane/propel/icons";
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
          icon: EditIcon,
          shouldRender: canEdit,
        },
        {
          key: "copy_link",
          action: () => activityOperations.copyCommentLink(comment.id),
          title: t("common.actions.copy_link"),
          icon: LinkIcon,
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
          icon: comment.access === EIssueCommentAccessSpecifier.INTERNAL ? GlobeIcon : LockIcon,
          shouldRender: showAccessSpecifier,
        },
        {
          key: "delete",
          action: () => activityOperations.removeComment(comment.id),
          title: t("common.actions.delete"),
          icon: TrashIcon,
          shouldRender: canDelete,
        },
      ];
    },
    [t, setEditMode, canEdit, showCopyLinkOption, activityOperations, comment, showAccessSpecifier, canDelete]
  );

  return (
    <CustomMenu customButton={<IconButton icon={MoreHorizontal} variant="ghost" size="sm" />} closeOnSelect>
      {MENU_ITEMS.map((item) => {
        if (item.shouldRender === false) return null;

        return (
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
            {item.icon && <item.icon className={cn("shrink-0 size-3", item.iconClassName)} />}
            <div>
              <h5>{item.title}</h5>
              {item.description && (
                <p
                  className={cn("text-tertiary whitespace-pre-line", {
                    "text-placeholder": item.disabled,
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
