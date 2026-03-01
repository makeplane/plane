/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Search, Shapes } from "lucide-react";
import { CheckIcon } from "@plane/propel/icons";
import { Combobox } from "@headlessui/react";
// plane imports
import { getEditorContentWithReplacedAssets } from "@plane/editor";
import type { EditorTitleRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { FileService } from "@plane/services";
import type { TPageTemplate } from "@plane/types";
import { EFileAssetType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// helpers
// plane web hooks
import { usePageTemplates } from "@/plane-web/hooks/store";
// store
import type { IBaseTemplateInstance } from "@/store/templates";
import type { TPageInstance } from "@/store/pages/base-page";

const fileService = new FileService();

type TTemplateSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  page: TPageInstance;
  projectId: string | undefined;
  titleEditorRef: EditorTitleRefApi;
  workspaceSlug: string;
};

export const TemplateSelectModal = observer(function TemplateSelectModal(props: TTemplateSelectModalProps) {
  const { isOpen, onClose, page, projectId, titleEditorRef, workspaceSlug } = props;
  // refs
  const applyButtonRef = useRef<HTMLButtonElement>(null);
  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getAllTemplates, getTemplateById } = usePageTemplates();
  // derived values
  const { editorRef } = page.editor;
  const allPageTemplates = getAllTemplates(workspaceSlug);
  const filteredTemplates = useMemo(
    () =>
      allPageTemplates.filter((template) => {
        const templateQuery = `${template.name} ${template.template_data.name}`.toLowerCase();
        return templateQuery.includes(searchTerm.toLowerCase());
      }),
    [allPageTemplates, searchTerm]
  );

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedTemplateId(null);
    }
  }, [isOpen]);

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId || !page.id) return;
    const selectedTemplate = getTemplateById(selectedTemplateId);
    if (!selectedTemplate) return;
    setIsApplyingTemplate(true);
    // duplicate template assets and replace the old assets with the new ones
    const duplicateAssetService = fileService.duplicateAssets.bind(fileService, workspaceSlug);
    const documentPayload = await getEditorContentWithReplacedAssets({
      descriptionHTML: selectedTemplate.template_data.description_html ?? "",
      entityId: page.id,
      entityType: EFileAssetType.PAGE_DESCRIPTION,
      projectId,
      variant: "document",
      duplicateAssetService,
    });
    await page.update({
      logo_props: selectedTemplate.template_data.logo_props,
    });
    page.mutateProperties({
      name: selectedTemplate.template_data.name,
    });
    editorRef?.clearEditor();
    editorRef?.setEditorValue(documentPayload.description_html, true);
    titleEditorRef.clearEditor();
    titleEditorRef.setEditorValue(`<p>${selectedTemplate.template_data.name}</p>`, true);
    onClose();
    setIsApplyingTemplate(false);
  };

  const renderEmptyState = useCallback(() => {
    if (allPageTemplates.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
          <SimpleEmptyState
            title={t("templates.empty_state.page.no_templates.title")}
            description={t("templates.empty_state.page.no_templates.description")}
          />
        </div>
      );
    }

    if (filteredTemplates.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
          <SimpleEmptyState
            title={t("templates.empty_state.page.no_results.title")}
            description={t("templates.empty_state.page.no_results.description")}
          />
        </div>
      );
    }

    return null;
  }, [allPageTemplates.length, filteredTemplates.length, t]);

  const renderTemplateOption = useCallback(
    (template: IBaseTemplateInstance<TPageTemplate>) => {
      const isTemplateSelected = selectedTemplateId === template.id;
      return (
        <Combobox.Option
          key={template.id}
          value={template.id}
          className={({ active }) =>
            cn(
              "flex items-center justify-between gap-2 truncate w-full cursor-pointer select-none rounded-md p-2 text-secondary transition-colors",
              {
                "bg-layer-1": active,
                "text-primary": isTemplateSelected,
              }
            )
          }
        >
          <div className="flex items-center gap-2 truncate">
            <span className="flex-shrink-0 size-4 grid place-items-center">
              {isTemplateSelected ? (
                <CheckIcon className="size-4 text-primary" />
              ) : (
                <Shapes className="size-4 text-primary" />
              )}
            </span>
            <p className="text-13 truncate">{template.name}</p>
          </div>
        </Combobox.Option>
      );
    },
    [selectedTemplateId]
  );

  const renderTemplateList = useCallback(() => {
    const emptyState = renderEmptyState();
    if (emptyState) return emptyState;
    return <ul className="px-2 text-primary">{filteredTemplates.map(renderTemplateOption)}</ul>;
  }, [filteredTemplates, renderEmptyState, renderTemplateOption]);

  return (
    <ModalCore isOpen={isOpen} width={EModalWidth.LG} position={EModalPosition.TOP} handleClose={onClose}>
      <Combobox
        as="div"
        value={selectedTemplateId}
        onChange={(val: string) => {
          if (val === selectedTemplateId) {
            setSelectedTemplateId(null);
          } else {
            setSelectedTemplateId(val);
          }
          setSearchTerm("");
          applyButtonRef.current?.focus();
        }}
      >
        <div className="flex items-center gap-2 px-4">
          <Search className="flex-shrink-0 size-4 text-placeholder" aria-hidden="true" />
          <Combobox.Input
            className="h-12 w-full border-0 bg-transparent text-13 text-primary outline-none placeholder:text-placeholder focus:ring-0"
            placeholder={t("common.search.placeholder")}
            displayValue={() => ""}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Combobox.Options static className="vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-y-auto">
          {renderTemplateList()}
        </Combobox.Options>
      </Combobox>
      <div className="flex items-center justify-end gap-2 p-3">
        <Button variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          ref={applyButtonRef}
          variant="primary"
          onClick={handleApplyTemplate}
          loading={isApplyingTemplate}
          disabled={!selectedTemplateId}
        >
          {isApplyingTemplate ? t("common.applying") : t("common.apply")}
        </Button>
      </div>
    </ModalCore>
  );
});
