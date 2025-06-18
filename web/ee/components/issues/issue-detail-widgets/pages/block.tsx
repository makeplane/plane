import React, { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { CircleX, Files, FileText, Link2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TIssuePage, TIssueServiceType, TLogoProps } from "@plane/types";
import { setToast, TContextMenuItem, TOAST_TYPE, CustomMenu, Logo } from "@plane/ui";
import { calculateTimeAgo, cn, copyUrlToClipboard } from "@plane/utils";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { useIssueDetail, useProject } from "@/hooks/store";

type TProps = {
  issueServiceType: TIssueServiceType;
  workItemId: string;
  workspaceSlug: string;
  projectId: string;
  page: TIssuePage;
};

export const PagesCollapsibleContentBlock: FC<TProps> = observer((props) => {
  const { page, workspaceSlug, projectId, workItemId, issueServiceType } = props;
  // hooks
  const { t } = useTranslation();
  const { getProjectById } = useProject();
  const {
    pages: { deleteIssuePages },
  } = useIssueDetail(issueServiceType);
  // derived
  const project = getProjectById(projectId);

  const handleCopyText = () => {
    const url = page.is_global ? `pages/${page.id}` : `projects/${projectId}/pages/${page.id}`;

    copyUrlToClipboard(`${workspaceSlug}/${url}`).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("link_copied"),
        message: t("entity.link_copied_to_clipboard", { entity: t("page") }),
      });
    });
  };

  const handleRemove = async () => {
    deleteIssuePages(workspaceSlug, projectId, workItemId, page.id)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("issue.pages.toasts.remove.success.title"),
          message: t("issue.pages.toasts.remove.success.message"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("issue.pages.toasts.remove.error.title"),
          message: t("issue.pages.toasts.remove.error.message"),
        });
      });
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "copy",
      action: () => handleCopyText(),
      title: "Copy link",
      icon: () => <Link2 className="size-3 -rotate-45" />,
    },
    {
      key: "remove",
      action: () => handleRemove(),
      title: "Remove",
      icon: () => <CircleX className="size-3" />,
    },
  ];

  return (
    <div
      key={page.id}
      className="flex flex-col gap-2 rounded-xl border border-custom-border-100 p-4 pb-2 min-h-[166px]"
    >
      <Link
        href={
          page.is_global
            ? `/${workspaceSlug}/pages/${page.id}`
            : `/${workspaceSlug}/projects/${projectId}/pages/${page.id}`
        }
        target="_blank"
        className="border-b border-custom-border-100 pb-2 flex flex-col gap-2 flex-1"
      >
        <div className="flex gap-2 items-center max-w-full w-fit overflow-hidden bg-custom-background-90 p-1 rounded">
          <div className="my-auto">
            {page.is_global ? (
              <Files className="size-[14px] text-custom-text-400" />
            ) : (
              <Logo logo={project?.logo_props as TLogoProps} size={14} />
            )}
          </div>
          <span className="text-sm font-medium text-custom-text-350 my-auto truncate">
            {page.is_global ? "Wiki" : project?.name}
          </span>
        </div>
        <div className="flex flex-col gap-2 ">
          <div className="flex gap-1 items-center">
            {page.logo_props && page.logo_props?.in_use ? (
              <Logo logo={page.logo_props} size={16} type="lucide" />
            ) : (
              <FileText className="size-4 text-custom-text-300" />
            )}
            <div className="text-base font-medium text-custom-text-200 line-clamp-2 overflow-hidden">{page.name}</div>
          </div>
          <div className="text-sm text-custom-text-350 line-clamp-3 overflow-hidden">
            {page.description_stripped === "" ? t("issue.pages.no_description") : page.description_stripped}
          </div>
        </div>
      </Link>
      <div className="flex gap-2 justify-between items-center">
        <div>{page.created_by && <ButtonAvatars showTooltip userIds={[page.created_by]} />}</div>
        <div className="flex gap-2">
          {page.updated_at && (
            <div className="text-xs text-custom-text-350">Last updated {calculateTimeAgo(page.updated_at)}</div>
          )}
          <CustomMenu
            placement="bottom-end"
            menuItemsClassName="z-20"
            buttonClassName="!p-0.5 text-custom-text-300"
            closeOnSelect
            verticalEllipsis
          >
            {MENU_ITEMS.map((item) => (
              <CustomMenu.MenuItem
                key={item.key}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  item.action();
                }}
                className={cn("flex items-center gap-2")}
              >
                {item.icon && <item.icon />}
                <div>
                  <h5>{item.title}</h5>
                </div>
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
        </div>
      </div>
    </div>
  );
});
