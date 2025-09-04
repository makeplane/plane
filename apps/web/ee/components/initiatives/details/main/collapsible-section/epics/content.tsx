"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { ListFilter } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { GroupByColumnTypes } from "@plane/types";
import { Button, EpicIcon, getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
import { getGroupByColumns } from "@/components/issues/issue-layouts/utils";
// plane-web
import { SectionEmptyState } from "@/plane-web/components/common/layout/main/common/empty-state";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local components
import { EpicsGroup } from "./epic-list-item/epics-list-group";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  toggleEpicModal: (value: boolean) => void;
  disabled?: boolean;
};

export const InitiativeEpicsCollapsibleContent: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, toggleEpicModal, disabled = false } = props;
  // store hooks
  const {
    initiative: {
      epics: {
        getInitiativeEpicsById,
        filters: { getInitiativeEpicsFiltersById, getGroupedEpics, getFilteredEpics, resetFilters },
      },
    },
  } = useInitiatives();

  const { t } = useTranslation();

  // derived values
  const filters = getInitiativeEpicsFiltersById(initiativeId);
  const groupBy = filters?.displayFilters?.group_by;
  const groupedEpicIds = getGroupedEpics(initiativeId);
  const filteredEpicsCount = getFilteredEpics(initiativeId, filters?.filters ?? {}).length;

  const groups = getGroupByColumns({
    groupBy: groupBy as GroupByColumnTypes,
    includeNone: true,
    isWorkspaceLevel: true,
    isEpic: false,
  });

  // derived values
  const initiativeEpicIds = getInitiativeEpicsById(initiativeId) ?? [];

  return (
    <div className="mt-3">
      {initiativeEpicIds.length > 0 ? (
        filteredEpicsCount > 0 ? (
          groups?.map((group) => (
            <EpicsGroup
              key={group.id}
              group={group}
              epicIds={groupedEpicIds?.[group.id] ?? []}
              disabled={disabled}
              workspaceSlug={workspaceSlug}
              initiativeId={initiativeId}
            />
          ))
        ) : (
          <SectionEmptyState
            heading={t("initiatives.empty_state.epics.title")}
            subHeading={t("initiatives.empty_state.epics.subHeading")}
            icon={<ListFilter />}
            actionElement={
              <Button variant="neutral-primary" size="sm" onClick={() => resetFilters(initiativeId)}>
                {t("initiatives.empty_state.epics.action")}
              </Button>
            }
          />
        )
      ) : (
        <SectionEmptyState
          heading={t("epics.empty_state.section.title")}
          subHeading={t("epics.empty_state.section.description")}
          icon={<EpicIcon className="size-4" />}
          actionElement={
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleEpicModal(true);
              }}
              disabled={disabled}
            >
              <span className={cn(getButtonStyling("accent-primary", "sm"), "font-medium px-2 py-1")}>
                {t("epics.empty_state.section.primary_button.text")}
              </span>
            </button>
          }
        />
      )}
    </div>
  );
});
