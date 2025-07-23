import { RefObject, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane
import { Briefcase } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { EGanttBlockType } from "@plane/types";
import { EpicIcon } from "@plane/ui";
// hooks
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { ProjectGanttSidebarBlock } from "@/plane-web/components/projects/layouts/gantt";
import { ListHeader } from "../../list/header";
import { EpicSidebarBlock } from "./epic-block";

type Props = {
  loadMoreBlocks?: () => void;
  ganttContainerRef: RefObject<HTMLDivElement>;
  showAllBlocks?: boolean;
  handleAddBlock: (type: EGanttBlockType) => Promise<void>;
};

export const GroupedGanttSidebar: React.FC<Props> = observer((props) => {
  const { showAllBlocks = false, handleAddBlock, ganttContainerRef } = props;

  const { getBlockById, getGroupedBlockIds, toggleGroup } = useTimeLineChartStore();

  const { t } = useTranslation();

  const [ganttContainerWidth, setGanttContainerWidth] = useState(0);

  const groupedBlockIds = getGroupedBlockIds();

  const handleAdd = async (type: EGanttBlockType) => {
    await handleAddBlock(type);
    toggleGroup(type);
  };

  /** Set width for group header */
  useEffect(() => {
    if (ganttContainerRef.current) {
      setGanttContainerWidth(ganttContainerRef.current.clientWidth);
    }
  }, [ganttContainerRef]);

  const blockTypeConfig: Record<EGanttBlockType, { title: string; icon: JSX.Element }> = {
    [EGanttBlockType.EPIC]: {
      title: t("common.epics"),
      icon: <EpicIcon className="size-4" />,
    },
    [EGanttBlockType.PROJECT]: {
      title: t("common.projects"),
      icon: <Briefcase className="size-4" />,
    },
    [EGanttBlockType.WORK_ITEM]: {
      title: t("common.issues"),
      icon: <Briefcase className="size-4" />,
    },
  };

  const getListTitle = (type: EGanttBlockType) => blockTypeConfig[type]?.title ?? "";

  const getListIcon = (type: EGanttBlockType) => blockTypeConfig[type]?.icon;

  return groupedBlockIds.map((group) => {
    const type = group.type;
    const blockIds = group.blockIds;
    if (!blockIds) return;

    return (
      <>
        <ListHeader
          count={group.count ?? 0}
          label={getListTitle(type)}
          handleAdd={() => handleAdd(type)}
          onClick={() => toggleGroup(type)}
          style={{ width: ganttContainerWidth, height: BLOCK_HEIGHT }}
          customClassName="border-[1px]"
          icon={getListIcon(type)}
        />
        <>
          {blockIds.map((blockId) => {
            const block = getBlockById(blockId);
            const isBlockVisibleOnSidebar = block?.start_date && block?.target_date;
            const type = block?.meta?.type;

            // hide the block if it doesn't have start and target dates and showAllBlocks is false
            if (!block || (!showAllBlocks && !isBlockVisibleOnSidebar)) return;

            switch (type) {
              case EGanttBlockType.EPIC:
                return <EpicSidebarBlock key={blockId} block={block} />;
              case EGanttBlockType.PROJECT:
                return <ProjectGanttSidebarBlock key={blockId} block={block} />;
            }
          })}
        </>
      </>
    );
  });
});
