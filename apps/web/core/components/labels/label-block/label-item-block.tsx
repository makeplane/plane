/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { MutableRefObject } from "react";
import { useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
// plane helpers
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { CloseOutline, MoreHorizontalOutline } from "@makeplane/propel/icons";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import type { ISvgIcons } from "@plane/blocks/icons";
// types
import type { IIssueLabel } from "@plane/types";
// ui
import { DragHandle } from "@plane/blocks/common";
// helpers
import { cn } from "@plane/utils";
// components
import { LabelName } from "./label-name";

export interface ICustomMenuItem {
  CustomIcon: LucideIcon | React.FC<ISvgIcons>;
  onClick: (label: IIssueLabel) => void;
  isVisible: boolean;
  text: string;
  key: string;
}

interface ILabelItemBlock {
  label: IIssueLabel;
  isDragging: boolean;
  customMenuItems: ICustomMenuItem[];
  handleLabelDelete: (label: IIssueLabel) => void;
  isLabelGroup?: boolean;
  dragHandleRef: MutableRefObject<HTMLButtonElement | null>;
  disabled?: boolean;
  draggable?: boolean;
}

export function LabelItemBlock(props: ILabelItemBlock) {
  const {
    label,
    isDragging,
    customMenuItems,
    handleLabelDelete,
    isLabelGroup,
    dragHandleRef,
    disabled = false,
    draggable = true,
  } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isMenuActive, setIsMenuActive] = useState(true);
  // refs
  const actionSectionRef = useRef<HTMLDivElement | null>(null);

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

  return (
    <div className="group flex items-center">
      <div className="flex items-center">
        {!disabled && draggable && (
          <DragHandle
            className={cn("opacity-0 group-hover:opacity-100", {
              "opacity-100": isDragging,
            })}
            ref={dragHandleRef}
          />
        )}
        <LabelName color={label.color} name={label.name} isGroup={isLabelGroup ?? false} />
      </div>

      {!disabled && (
        <div
          ref={actionSectionRef}
          className={`absolute right-2.5 flex items-center gap-2 px-4 ${
            isMenuActive || isLabelGroup
              ? "opacity-100"
              : "opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"
          } ${isLabelGroup && "-top-0.5"}`}
        >
          <Menu onOpenChange={(open) => setIsMenuActive(open)}>
            <MenuTrigger
              render={
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label={t("aria_labels.common.more_actions")}
                  icon={<Icon icon={MoreHorizontalOutline} />}
                />
              }
            />
            <MenuContent>
              {customMenuItems.map(
                ({ isVisible, onClick, CustomIcon, text, key }) =>
                  isVisible && (
                    <MenuItem
                      key={key}
                      variant={key === "delete_label" ? "danger" : "neutral"}
                      label={text}
                      icon={<CustomIcon className="size-4" />}
                      onClick={() => onClick(label)}
                    />
                  )
              )}
            </MenuContent>
          </Menu>
          {!isLabelGroup && (
            <div className="py-0.5">
              <button
                type="button"
                aria-label={t("delete")}
                className="flex size-5 items-center justify-center rounded-sm hover:bg-layer-1"
                onClick={() => {
                  handleLabelDelete(label);
                }}
              >
                <CloseOutline className="size-3.5 flex-shrink-0 text-tertiary" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
