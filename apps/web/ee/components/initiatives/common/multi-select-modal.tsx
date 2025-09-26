import React, { useEffect, useMemo, useRef, useState } from "react";
import { xor } from "lodash-es";
import { observer } from "mobx-react";
import { Search, X } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane ui
import { useTranslation } from "@plane/i18n";
import { InitiativeIcon } from "@plane/propel/icons";
import { Button, Checkbox, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// helpers
// hooks
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  isOpen: boolean;
  selectedInitiativeIds: string[];
  onSubmit: (initiativeIds: string[]) => Promise<void>;
  onClose: () => void;
};

export const InitiativeMultiSelectModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, selectedInitiativeIds: selectedInitiativeIdsProp, onSubmit } = props;
  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInitiativeIds, setSelectedInitiativeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // refs
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  // plane hooks
  const { t } = useTranslation();
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
  const filteredInitiativeResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/search/search" });

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
        <div className="flex items-center gap-2 px-4 border-b border-custom-border-100">
          <Search className="flex-shrink-0 size-4 text-custom-text-400" aria-hidden="true" />
          <Combobox.Input
            className="h-12 w-full border-0 bg-transparent text-sm text-custom-text-100 outline-none placeholder:text-custom-text-400 focus:ring-0"
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
                  className="group flex items-center gap-1.5 bg-custom-background-90 px-2 py-1 rounded cursor-pointer overflow-hidden"
                  onClick={() => {
                    handleSelectedInitiativeChange(selectedInitiativeIds.filter((id) => id !== initiativeDetails.id));
                  }}
                >
                  <InitiativeIcon className="size-4 text-custom-text-300 flex-shrink-0" />
                  <p className="text-xs truncate text-custom-text-300 group-hover:text-custom-text-200 transition-colors">
                    {initiativeDetails.name}
                  </p>
                  <X className="size-3 flex-shrink-0 text-custom-text-400 group-hover:text-custom-text-200 transition-colors" />
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
              className={cn("text-custom-text-100", {
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
                        "flex items-center justify-between gap-2 truncate w-full cursor-pointer select-none rounded-md p-2 text-custom-text-200 transition-colors",
                        {
                          "bg-custom-background-80": active,
                          "text-custom-text-100": isInitiativeSelected,
                        }
                      )
                    }
                  >
                    <div className="flex items-center gap-2 w-full overflow-hidden">
                      <span className="flex-shrink-0 flex items-center gap-2.5">
                        <Checkbox checked={isInitiativeSelected} />
                      </span>
                      <InitiativeIcon className="size-4 text-custom-text-300 flex-shrink-0" />
                      <p className="text-sm truncate">{initiativeDetails.name}</p>
                    </div>
                  </Combobox.Option>
                );
              })}
            </ul>
          )}
        </Combobox.Options>
      </Combobox>
      <div className="flex items-center justify-end gap-2 p-3 border-t border-custom-border-100">
        <Button variant="neutral-primary" size="sm" onClick={handleClose}>
          {t("cancel")}
        </Button>
        <Button
          ref={moveButtonRef}
          variant="primary"
          size="sm"
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
