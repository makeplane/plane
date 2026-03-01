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

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
import useDebounce from "@/hooks/use-debounce";
import { IssueTypeIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { useIssueTypes } from "@/plane-web/hooks/store";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (typeId: string) => void;
};

export const SelectTypesModal = observer(function SelectTypesModal(props: Props) {
  const { isOpen, onClose, onSelect } = props;
  // router
  const { projectId } = useParams();
  // states
  const [searchQuery, setSearchQuery] = useState("");

  //hooks
  const { getProjectIssueTypes } = useIssueTypes();
  const { t } = useTranslation();

  // derived values
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const projectWorkItemTypes = useMemo(
    () => (projectId ? getProjectIssueTypes(projectId.toString(), true) : {}),
    [projectId, getProjectIssueTypes]
  );

  const filteredWorkItemTypes = useMemo(
    () =>
      Object.values(projectWorkItemTypes).filter(
        (issueType) => issueType.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ?? true
      ),
    [debouncedSearchQuery, projectWorkItemTypes]
  );

  const handleSelect = (typeId: string) => {
    onSelect(typeId);
    onClose();
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.TOP} width={EModalWidth.MD}>
      <div className="p-4">
        <h3 className="text-16 font-medium text-secondary pb-2">{t("intake_forms.type_forms.select_types.title")}</h3>
        <div className="flex gap-2 border border-subtle-1 items-center rounded-md px-2 py-1 mb-2">
          <Search className="size-3 text-tertiary" />
          <Input
            placeholder={t("intake_forms.type_forms.select_types.search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="outline-none border-none w-full text-13 p-0"
          />
        </div>
        {/* Search Results */}
        <div className="space-y-3 mt-3">
          {filteredWorkItemTypes.map((type) => {
            if (!type.id) return;
            return (
              <div
                className="flex items-center gap-2 cursor-pointer"
                key={type.id}
                onClick={() => handleSelect(type.id as string)}
              >
                <IssueTypeIdentifier issueTypeId={type.id} size="md" />
                <span className="text-13 text-tertiary">{type.name}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end border-t border-subtle-1 pt-2 mt-2">
          <Button variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
