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

import { useMemo, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { isAllowedFormulaPropertyType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Calendar, Hash, AlignLeft, ToggleLeft } from "lucide-react";
import type { TIssueProperty, EIssuePropertyType } from "@plane/types";
import { cn } from "@plane/utils";

type TFieldReferencePickerProps = {
  properties: TIssueProperty<EIssuePropertyType>[];
  currentPropertyId?: string;
  onSelect: (property: TIssueProperty<EIssuePropertyType>) => void;
  onClose: () => void;
  initialSearchQuery?: string;
};

// Get icon for property type
const getPropertyIcon = (propertyType: EIssuePropertyType) => {
  switch (propertyType) {
    case "DATETIME":
      return Calendar;
    case "DECIMAL":
      return Hash;
    case "TEXT":
      return AlignLeft;
    case "BOOLEAN":
      return ToggleLeft;
    default:
      return AlignLeft;
  }
};

export const FieldReferencePicker = observer(function FieldReferencePicker(props: TFieldReferencePickerProps) {
  const { properties, currentPropertyId, onSelect, onClose, initialSearchQuery = "" } = props;

  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter properties based on search and allowed types
  const filteredProperties = useMemo(() => {
    const filtered = properties.filter((p) => {
      // Must be an allowed type for formulas
      if (!isAllowedFormulaPropertyType(p.property_type)) return false;

      // Cannot reference self
      if (p.id === currentPropertyId) return false;

      // Must be active
      if (!p.is_active) return false;

      // Filter by search query (autocomplete)
      if (initialSearchQuery) {
        return p.display_name?.toLowerCase().includes(initialSearchQuery.toLowerCase());
      }

      return true;
    });

    return filtered;
  }, [properties, currentPropertyId, initialSearchQuery]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [onClose]);

  // Reset selected index when filtered properties change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredProperties.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredProperties.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredProperties[selectedIndex]) {
          onSelect(filteredProperties[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredProperties, selectedIndex, onSelect, onClose]);

  return (
    <div
      ref={containerRef}
      role="listbox"
      aria-label="Property suggestions"
      className="absolute left-0 right-0 top-full mt-1 bg-surface-1 border border-subtle-1 rounded shadow-md max-h-52 overflow-hidden z-[5]"
    >
      {/* Property list - autocomplete style */}
      <div className="py-1 overflow-y-auto max-h-52">
        {filteredProperties.length > 0 ? (
          filteredProperties.map((property, index) => {
            const IconComponent = property.property_type ? getPropertyIcon(property.property_type) : AlignLeft;
            const isSelected = index === selectedIndex;
            return (
              <button
                key={property.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(property)}
                className={cn(
                  "w-full flex items-center gap-1.5 px-2 py-1 text-left",
                  "hover:bg-surface-2 cursor-pointer transition-colors",
                  isSelected && "bg-surface-2"
                )}
              >
                <IconComponent className="size-3 shrink-0 text-tertiary" />
                <span className="text-caption-xs-regular text-primary truncate">{property.display_name}</span>
              </button>
            );
          })
        ) : (
          <div className="px-3 py-2 text-center text-13 text-tertiary">
            {initialSearchQuery
              ? t("work_item_types.settings.properties.formula.picker.no_match")
              : t("work_item_types.settings.properties.formula.picker.no_available")}
          </div>
        )}
      </div>
    </div>
  );
});
