"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// icons
import { Pencil, Trash2 } from "lucide-react";
// plane imports
import { ETemplateLevel } from "@plane/constants";
import { TBaseTemplateWithData } from "@plane/types";
import { AlertModalCore, ContextMenu, CustomMenu, setToast, TContextMenuItem, TOAST_TYPE } from "@plane/ui";
// helpers
import { getCreateTemplateSettingsPath } from "@plane/utils";
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { IBaseTemplateStore } from "@/plane-web/store/templates";

type TTemplateQuickActionsProps<T extends TBaseTemplateWithData> = {
  templateId: string;
  workspaceSlug: string;
  parentRef: React.RefObject<HTMLDivElement> | null;
  isEditingAllowed: boolean;
  getTemplateById: IBaseTemplateStore<T>["getTemplateById"];
  deleteTemplate: (templateId: string) => Promise<void>;
};

export const TemplateQuickActions = observer(
  <T extends TBaseTemplateWithData>(props: TTemplateQuickActionsProps<T>) => {
    const { templateId, workspaceSlug, parentRef, isEditingAllowed, getTemplateById, deleteTemplate } = props;
    // router
    const router = useAppRouter();
    // states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    // derived values
    const template = getTemplateById(templateId);
    if (!template) return null;

    const handleEditTemplate = () => {
      const updateTemplatePath =
        getCreateTemplateSettingsPath({
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
            title: "Success!",
            message: "Template deleted successfully.",
          });
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Template could not be deleted. Please try again.",
          });
        })
        .finally(() => {
          setIsDeleteLoading(false);
        });
    };

    const MENU_ITEMS: TContextMenuItem[] = [
      {
        key: "edit",
        title: "Edit",
        icon: Pencil,
        action: handleEditTemplate,
        shouldRender: isEditingAllowed,
      },
      {
        key: "delete",
        action: handleDeleteTemplateModal,
        title: "Delete",
        icon: Trash2,
        shouldRender: isEditingAllowed,
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
          title="Delete Template"
          content={
            <>
              Are you sure you want to delete template-{" "}
              <span className="font-medium text-custom-text-100">{template.name}</span>? All of the data related to the
              template will be permanently removed. This action cannot be undone.
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
