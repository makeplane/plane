/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Tab, Tabs, TabsList } from "@makeplane/propel/components/tabs";
import { ArrowCollapseOutline, ArrowExpandOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// plane
import type { TGanttViews } from "@plane/types";
import { Row } from "@plane/blocks/layout";
// components
import { VIEWS_LIST } from "@/components/gantt-chart/data";
// helpers
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { GANTT_BREADCRUMBS_HEIGHT } from "../constants";

type Props = {
  blockIds: string[];
  fullScreenMode: boolean;
  handleChartView: (view: TGanttViews) => void;
  handleToday: () => void;
  loaderTitle: string;
  toggleFullScreenMode: () => void;
  showToday: boolean;
};

export const GanttChartHeader = observer(function GanttChartHeader(props: Props) {
  const { t } = useTranslation();
  const { blockIds, fullScreenMode, handleChartView, handleToday, loaderTitle, toggleFullScreenMode, showToday } =
    props;
  // chart hook
  const { currentView } = useTimeLineChartStore();

  return (
    <Row
      className="relative flex w-full flex-shrink-0 flex-wrap items-center gap-2 bg-surface-1 py-2 whitespace-nowrap"
      style={{ height: `${GANTT_BREADCRUMBS_HEIGHT}px` }}
    >
      <div className="ml-auto">
        <div className="ml-auto text-caption-sm-medium text-tertiary">
          {blockIds ? `${blockIds.length} ${loaderTitle}` : t("common.loading")}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={currentView} variant="contained" stretch="auto">
          <TabsList aria-label={t("common.view")}>
            {VIEWS_LIST.map((chartView) => (
              <Tab
                key={chartView.key}
                value={chartView.key}
                label={t(chartView.i18n_title)}
                onClick={() => handleChartView(chartView.key as TGanttViews)}
              />
            ))}
          </TabsList>
        </Tabs>
      </div>

      {showToday && (
        <Button
          type="button"
          variant="secondary"
          size="md"
          stretch="auto"
          label={t("common.today")}
          onClick={handleToday}
        />
      )}

      <IconButton
        type="button"
        variant="secondary"
        size="md"
        aria-label={t("common.full_screen")}
        aria-pressed={fullScreenMode}
        onClick={toggleFullScreenMode}
        icon={fullScreenMode ? <ArrowCollapseOutline /> : <ArrowExpandOutline />}
      />
    </Row>
  );
});
