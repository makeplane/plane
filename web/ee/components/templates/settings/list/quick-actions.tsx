"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// icons
import { Earth, Pencil, Trash2 } from "lucide-react";
// plane imports
import { ETemplateLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TBaseTemplateWithData } from "@plane/types";
import { AlertModalCore, ContextMenu, CustomMenu, setToast, TContextMenuItem, TOAST_TYPE } from "@plane/ui";
import {
  cn,
  getCreateUpdateTemplateSettingsPath,
  getPublishTemplateSettingsPath,
  getTemplateTypeI18nName,
} from "@plane/utils";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { IBaseTemplateStore } from "@/plane-web/store/templates";

type TTemplateQuickActionsProps<T extends TBaseTemplateWithData> = {
  templateId: string;
  workspaceSlug: string;
  parentRef: React.RefObject<HTMLDivElement> | null;
  getTemplateById: IBaseTemplateStore<T>["getTemplateById"];
  deleteTemplate: (templateId: string) => Promise<void>;
};

export const TemplateQuickActions = observer(
  <T extends TBaseTemplateWithData>(props: TTemplateQuickActionsProps<T>) => {
    const { templateId, workspaceSlug, parentRef, getTemplateById, deleteTemplate } = props;
    // router
    const router = useAppRouter();
    // states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    // plane hooks
    const { t } = useTranslation();
    // derived values
    const template = getTemplateById(templateId);
    const isAnyActionAllowed = template?.canCurrentUserEditTemplate || template?.canCurrentUserDeleteTemplate;
    if (!template || !isAnyActionAllowed) return null;

    const handleEditTemplate = () => {
      const updateTemplatePath =
        getCreateUpdateTemplateSettingsPath({
          type: template.template_type,
          workspaceSlug,
          ...(template.project
            ? { level: ETemplateLevel.PROJECT, projectId: template.project }
            : { level: ETemplateLevel.WORKSPACE }),
        }) +
        "?templateId=" +
        templateId;

      router.push(updateTemplatePath);
    };

    const handlePublishTemplate = () => {
      const publishTemplatePath = getPublishTemplateSettingsPath({
        type: template.template_type,
        workspaceSlug,
        ...(template.project
          ? { level: ETemplateLevel.PROJECT, projectId: template.project }
          : { level: ETemplateLevel.WORKSPACE }),
        templateId,
      });
      router.push(publishTemplatePath);
    };

    const handleDeleteTemplateModal = () => {
      setIsDeleteModalOpen(true);
    };

    const handleTemplateDeletion = async () => {
      if (!workspaceSlug || !template.id) return;

      setIsDeleteLoading(true);
      await deleteTemplate(template.id)
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("templates.toasts.delete.success.title"),
            message: t("templates.toasts.delete.success.message", {
              templateName: template.name,
              templateType: t(getTemplateTypeI18nName(template.template_type))?.toLowerCase(),
            }),
          });
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("templates.toasts.delete.error.title"),
            message: t("templates.toasts.delete.error.message"),
          });
        })
        .finally(() => {
          setIsDeleteLoading(false);
        });
    };

    const MENU_ITEMS: TContextMenuItem[] = [
      {
        key: "edit",
        title: t("common.actions.edit"),
        icon: Pencil,
        action: handleEditTemplate,
        shouldRender: template.canCurrentUserEditTemplate,
      },
      {
        key: "publish",
        title: t("templates.settings.form.publish.action"),
        icon: Earth,
        action: handlePublishTemplate,
        shouldRender: template.canCurrentUserPublishTemplate,
      },
      {
        key: "delete",
        action: handleDeleteTemplateModal,
        title: t("common.actions.delete"),
        icon: Trash2,
        shouldRender: template.canCurrentUserDeleteTemplate,
        className: "text-red-500",
      },
    ];

    return (
      <>
        <AlertModalCore
          handleClose={() => setIsDeleteModalOpen(false)}
          handleSubmit={handleTemplateDeletion}
          isSubmitting={isDeleteLoading}
          isOpen={isDeleteModalOpen}
          title={t("templates.delete_confirmation.title")}
          content={
            <>
              {t("templates.delete_confirmation.description.prefix")}
              <span className="font-medium text-custom-text-100">{template.name}</span>
              {t("templates.delete_confirmation.description.suffix")}
            </>
          }
        />
        {parentRef && <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />}
        <CustomMenu ellipsis placement="bottom-end" closeOnSelect>
          {MENU_ITEMS.map((item) => {
            if (item.shouldRender === false) return null;
            return (
              <CustomMenu.MenuItem
                key={item.key}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  item.action();
                }}
                className={cn(
                  "flex items-center gap-2",
                  {
                    "text-custom-text-400": item.disabled,
                  },
                  item.className
                )}
                disabled={item.disabled}
              >
                {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
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
      </>
    );
  }
);
