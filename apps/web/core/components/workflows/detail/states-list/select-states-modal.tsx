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

import { useProjectState } from "@/hooks/store/use-project-state";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { CloseIcon, SearchIcon } from "@plane/propel/icons";
import { EModalPosition, EModalWidth, Loader, ModalCore } from "@plane/ui";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { useState } from "react";
import { Input } from "@plane/propel/input";
import useDebounce from "@/hooks/use-debounce";
import { StatesSelectList } from "./states-list";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  handleSubmit: (stateIds: string[]) => void;
  existingStateIds: string[];
};

export const SelectWorkflowStatesModal = observer(function SelectWorkflowStatesModal(props: Props) {
  // props
  const { isOpen, onClose, handleSubmit, existingStateIds } = props;
  // states
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  // hooks
  const { groupedProjectStates } = useProjectState();
  const { t } = useTranslation();

  // handlers
  const handleStateSelection = (stateId: string) => {
    setSelectedStates((prev) => {
      if (prev.includes(stateId)) {
        return prev.filter((id) => id !== stateId);
      }
      return [...prev, stateId];
    });
  };

  const onSubmit = () => {
    handleSubmit(selectedStates);
    handleClose();
  };

  const handleClose = () => {
    setSelectedStates([]);
    onClose();
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.LG} position={EModalPosition.TOP}>
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h5 className="text-h5-medium">Select states</h5>
          <IconButton icon={CloseIcon} onClick={handleClose} size="sm" variant={"ghost"} />
        </div>
        <Input
          placeholder="Search states"
          inputSize="xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
          prependIcon={<SearchIcon />}
        />
        <div className="max-h-[300px] overflow-y-scroll vertical-scrollbar scrollbar-sm">
          <div className="flex flex-col">
            {groupedProjectStates ? (
              Object.entries(groupedProjectStates).map(([groupKey, groupStates]) => {
                return (
                  <div key={groupKey} className="flex flex-col">
                    <p className="text-caption-md-regular capitalize text-tertiary py-1.5 px-2">{groupKey}</p>
                    <StatesSelectList
                      states={groupStates}
                      onChange={handleStateSelection}
                      existingStateIds={existingStateIds}
                      selectedStates={selectedStates}
                      searchQuery={debouncedSearchQuery}
                    />
                  </div>
                );
              })
            ) : (
              <Loader className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Loader.Item key={index} height="28px" width="100%" />
                ))}
              </Loader>
            )}
          </div>
        </div>
        <div className="border-t border-subtle" />
        <div className="flex items-center justify-end gap-2">
          <Button variant={"secondary"} onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button variant={"primary"} onClick={onSubmit}>
            Add selected
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
