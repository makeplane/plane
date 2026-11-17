/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/blocks/empty-state";
// components
import { SingleProgressStats } from "@/components/core/sidebar/single-progress-stats";

export type TLabelData = {
  id: string | undefined;
  title: string | undefined;
  color: string | undefined;
  completed: number;
  total: number;
}[];

type TLabelStatComponent = {
  selectedLabelIds: string[];
  handleLabelFiltersUpdate: (labelId: string | undefined) => void;
  distribution: TLabelData;
  isEditable?: boolean;
};

export const LabelStatComponent = observer(function LabelStatComponent(props: TLabelStatComponent) {
  const { distribution, isEditable, selectedLabelIds, handleLabelFiltersUpdate } = props;
  const { t } = useTranslation();
  return (
    <div>
      {distribution && distribution.length > 0 ? (
        distribution.map((label, index) => {
          if (label.id) {
            return (
              <SingleProgressStats
                key={label.id}
                title={
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="block h-3 w-3 flex-shrink-0 rounded-full"
                      style={{
                        backgroundColor: label.color ?? "transparent",
                      }}
                    />
                    <span className="truncate text-body-xs-regular text-ellipsis">
                      {label.title ?? t("no_labels_yet")}
                    </span>
                  </div>
                }
                completed={label.completed}
                total={label.total}
                {...(isEditable && {
                  onClick: () => handleLabelFiltersUpdate(label.id),
                  selected: label.id ? selectedLabelIds.includes(label.id) : false,
                })}
              />
            );
          } else {
            return (
              <SingleProgressStats
                key={`no-label-${index}`}
                title={
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="block h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: label.color ?? "transparent",
                      }}
                    />
                    <span className="truncate text-body-xs-regular">{label.title ?? t("no_labels_yet")}</span>
                  </div>
                }
                completed={label.completed}
                total={label.total}
              />
            );
          }
        })
      ) : (
        <EmptyStateCompact assetKey="label" title={t("no_labels_yet")} />
      )}
    </div>
  );
});
