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

import React, { useEffect, useMemo, useRef, useState } from "react";
import { xor } from "lodash-es";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { Search } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane ui
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { CloseIcon, InitiativeIcon } from "@plane/propel/icons";
import { Checkbox, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// assets
import { cn } from "@plane/utils";
import searchDark from "@/app/assets/empty-state/search/search-dark.webp?url";
import searchLight from "@/app/assets/empty-state/search/search-light.webp?url";
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// helpers
// hooks
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  isOpen: boolean;
  selectedInitiativeIds: string[];
  onSubmit: (initiativeIds: string[]) => Promise<void>;
  onClose: () => void;
};

export const InitiativeMultiSelectModal = observer(function InitiativeMultiSelectModal(props: Props) {
  const { isOpen, onClose, selectedInitiativeIds: selectedInitiativeIdsProp, onSubmit } = props;
  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInitiativeIds, setSelectedInitiativeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // refs
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  // plane hooks
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  // store hooks
  const {
    initiative: { initiativeIds, getInitiativeById },
  } = useInitiatives();

  // derived values
  const initiativeDetailsMap = useMemo(
    () => new Map(initiativeIds?.map((id) => [id, getInitiativeById(id)])),
    [initiativeIds, getInitiativeById]
  );
  const areSelectedInitiativesChanged = xor(selectedInitiativeIds, selectedInitiativeIdsProp).length > 0;
  const filteredInitiativeIds = initiativeIds?.filter((id) => {
    const initiative = initiativeDetailsMap.get(id);
    const initiativeQuery = `${initiative?.name}`.toLowerCase();
    return initiativeQuery.includes(searchTerm.toLowerCase());
  });
  const filteredInitiativeResolvedPath = resolvedTheme === "light" ? searchLight : searchDark;

  useEffect(() => {
    if (isOpen) setSelectedInitiativeIds(selectedInitiativeIdsProp);
  }, [isOpen, selectedInitiativeIdsProp]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSearchTerm("");
      setSelectedInitiativeIds([]);
    }, 300);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit(selectedInitiativeIds);
    setIsSubmitting(false);
    handleClose();
  };

  const handleSelectedInitiativeChange = (val: string[]) => {
    setSelectedInitiativeIds(val);
    setSearchTerm("");
    moveButtonRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <ModalCore isOpen={isOpen} width={EModalWidth.LG} position={EModalPosition.TOP} handleClose={handleClose}>
      <Combobox as="div" multiple value={selectedInitiativeIds} onChange={handleSelectedInitiativeChange}>
        <div className="flex items-center gap-2 px-4 border-b border-subtle">
          <Search className="flex-shrink-0 size-4 text-placeholder" aria-hidden="true" />
          <Combobox.Input
            className="h-12 w-full border-0 bg-transparent text-13 text-primary outline-none placeholder:text-placeholder focus:ring-0"
            placeholder="Search for Initiatives"
            displayValue={() => ""}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {selectedInitiativeIds.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 px-4">
            {selectedInitiativeIds.map((initiativeId) => {
              const initiativeDetails = initiativeDetailsMap.get(initiativeId);
              if (!initiativeDetails) return null;
              return (
                <div
                  key={initiativeDetails.id}
                  className="group flex items-center gap-1.5 bg-layer-1 px-2 py-1 rounded cursor-pointer overflow-hidden"
                  onClick={() => {
                    handleSelectedInitiativeChange(selectedInitiativeIds.filter((id) => id !== initiativeDetails.id));
                  }}
                >
                  {initiativeDetails?.logo_props?.in_use ? (
                    <Logo logo={initiativeDetails?.logo_props} size={16} type="lucide" />
                  ) : (
                    <InitiativeIcon className="size-4 text-tertiary flex-shrink-0" />
                  )}
                  <p className="text-11 truncate text-tertiary group-hover:text-secondary transition-colors">
                    {initiativeDetails.name}
                  </p>
                  <CloseIcon className="size-3 flex-shrink-0 text-placeholder group-hover:text-secondary transition-colors" />
                </div>
              );
            })}
          </div>
        )}
        <Combobox.Options
          static
          className="py-2 vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-y-auto transition-[height] duration-200 ease-in-out"
        >
          {filteredInitiativeIds?.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
              <SimpleEmptyState title={"No Initiatives found"} assetPath={filteredInitiativeResolvedPath} />
            </div>
          ) : (
            <ul
              className={cn("text-primary", {
                "px-2": filteredInitiativeIds && filteredInitiativeIds?.length > 0,
              })}
            >
              {filteredInitiativeIds?.map((initiativeId) => {
                const initiativeDetails = initiativeDetailsMap.get(initiativeId);
                if (!initiativeDetails) return null;
                const isInitiativeSelected = selectedInitiativeIds.includes(initiativeDetails.id);
                return (
                  <Combobox.Option
                    key={initiativeDetails.id}
                    value={initiativeDetails.id}
                    className={({ active }) =>
                      cn(
                        "flex items-center justify-between gap-2 truncate w-full cursor-pointer select-none rounded-md p-2 text-secondary transition-colors",
                        "flex items-center justify-between gap-2 truncate w-full cursor-pointer select-none rounded-md p-2 text-secondary transition-colors",
                        {
                          "bg-layer-1-hover": active,
                          "text-primary": isInitiativeSelected,
                        }
                      )
                    }
                  >
                    <div className="flex items-center gap-2 w-full overflow-hidden">
                      <span className="flex-shrink-0 flex items-center gap-2.5">
                        <Checkbox checked={isInitiativeSelected} />
                      </span>
                      {initiativeDetails?.logo_props?.in_use ? (
                        <Logo logo={initiativeDetails?.logo_props} size={16} type="lucide" />
                      ) : (
                        <InitiativeIcon className="size-4 text-tertiary flex-shrink-0" />
                      )}
                      <p className="text-13 truncate">{initiativeDetails.name}</p>
                    </div>
                  </Combobox.Option>
                );
              })}
            </ul>
          )}
        </Combobox.Options>
      </Combobox>
      <div className="flex items-center justify-end gap-2 p-3 border-t border-subtle">
        <Button variant="secondary" onClick={handleClose}>
          {t("cancel")}
        </Button>
        <Button
          ref={moveButtonRef}
          variant="primary"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!areSelectedInitiativesChanged}
        >
          {isSubmitting ? t("confirming") : t("confirm")}
        </Button>
      </div>
    </ModalCore>
  );
});
