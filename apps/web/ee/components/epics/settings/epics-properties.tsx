"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { ChevronRight } from "lucide-react";
// plane imports
import { EPIC_CUSTOM_PROPERTY_TRACKER_ELEMENTS, EPIC_CUSTOM_PROPERTY_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TLoader, IIssueType } from "@plane/types";
import { Collapsible } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// plane web components
import { IssuePropertiesRoot } from "@/plane-web/components/issue-types";

type EpicPropertiesProps = {
  epicId: string;
  propertiesLoader: TLoader;
  containerClassName?: string;
  getWorkItemTypeById: (issueTypeId: string) => IIssueType | undefined;
  getClassName?: (isOpen: boolean) => string;
};

export const EpicPropertiesRoot = observer((props: EpicPropertiesProps) => {
  // props
  const { epicId, propertiesLoader, containerClassName, getWorkItemTypeById, getClassName } = props;
  // hooks
  const { t } = useTranslation();
  // states
  const [isOpen, setIsOpen] = useState(true);
  // derived values
  const epicDetail = getWorkItemTypeById(epicId);

  if (!epicDetail) return null;

  return (
    <div className={cn("py-2 border-b border-custom-border-100 last:border-b-0", containerClassName)}>
      <div
        className={cn(
          "group/issue-type hover:bg-custom-background-90/60 rounded-md",
          {
            "bg-custom-background-90/60": isOpen,
          },
          getClassName?.(isOpen)
        )}
      >
        <Collapsible
          key={epicId}
          isOpen={isOpen}
          defaultOpen
          onToggle={() => setIsOpen(!isOpen)}
          title={
            <div className={cn("flex items-center w-full px-2 gap-2 cursor-pointer")}>
              <div className={cn("flex w-full gap-2 items-center truncate")}>
                <div className="flex-shrink-0">
                  <ChevronRight
                    className={cn("flex-shrink-0 size-4 transition-all", {
                      "rotate-90 text-custom-text-100": isOpen,
                      "text-custom-text-300": !isOpen,
                    })}
                  />
                </div>
                <div className="flex flex-col items-start justify-start whitespace-normal">
                  <div className="flex gap-4 text-left items-center">
                    <div className="text-sm text-custom-text-100 font-medium line-clamp-1">
                      {t("project_settings.epics.properties.title")}
                    </div>
                    {!epicDetail?.is_active && (
                      <div className="py-0.5 px-3 text-xs rounded font-medium text-custom-text-300 bg-custom-background-80/70">
                        {t("project_settings.epics.disabled")}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-custom-text-300 text-left line-clamp-1">
                    {t("project_settings.epics.properties.description")}
                  </div>
                </div>
              </div>
            </div>
          }
          className={cn("p-2")}
          buttonClassName={cn("flex w-full py-2 gap-2 items-center justify-between")}
        >
          <div className="p-2">
            <IssuePropertiesRoot
              issueTypeId={epicId}
              propertiesLoader={propertiesLoader}
              getWorkItemTypeById={getWorkItemTypeById}
              trackers={{
                create: {
                  button: EPIC_CUSTOM_PROPERTY_TRACKER_ELEMENTS.CREATE_PROPERTY_BUTTON,
                  eventName: EPIC_CUSTOM_PROPERTY_TRACKER_EVENTS.CREATE,
                },
                update: {
                  eventName: EPIC_CUSTOM_PROPERTY_TRACKER_EVENTS.UPDATE,
                },
                delete: {
                  eventName: EPIC_CUSTOM_PROPERTY_TRACKER_EVENTS.DELETE,
                },
              }}
            />
          </div>
        </Collapsible>
      </div>
    </div>
  );
});
