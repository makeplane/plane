import set from "lodash/set";
import { action, autorun, makeObservable, observable } from "mobx";
// Store
import { EGanttBlockType, TGanttBlockGroup } from "@plane/types";
import { RootStore } from "@/plane-web/store/root.store";
import { BaseTimeLineStore, IBaseTimelineStore } from "@/plane-web/store/timeline/base-timeline.store";

export class GroupedTimeLineStore extends BaseTimeLineStore implements IBaseTimelineStore {
  blockGroups: EGanttBlockType[] = [];

  constructor(_rootStore: RootStore) {
    super(_rootStore);

    makeObservable(this, {
      blockGroups: observable,
      setBlockGroups: action,
    });

    autorun(() => {
      if (this.blockGroups.length) {
        this.blockGroups.forEach((group, n) => {
          const type = group;
          const index = n + 1;
          if (type === EGanttBlockType.EPIC) {
            this.updateBlocks(this.rootStore.issue.issues.getIssueById, type, index);
          } else if (type === EGanttBlockType.PROJECT) {
            this.updateBlocks(this.rootStore.projectRoot.project.getProjectById, type, index);
          }
        });
      }
    });
  }

  setBlockGroups = (groupData: TGanttBlockGroup[]) => {
    this.setGrouping(true);
    const blockGroups = groupData.map((group) => {
      const type = group.type;
      return type;
    });
    set(this, "blockGroups", blockGroups);
    // Flatten all the block ids
    const flattenedBlockIds = groupData.flatMap((group) => group.blockIds);
    this.setBlockIds(flattenedBlockIds);
  };

  getGroupedBlockIds = (): TGanttBlockGroup[] => {
    const groupBlockIds: TGanttBlockGroup[] = this.blockGroups.map((group) => ({
      type: group,
      blockIds: [],
      count: 0,
    }));

    Object.entries(this.blocksMap).forEach(([blockId, block]) => {
      const type = block.meta?.type as EGanttBlockType;
      if (type) {
        const group = groupBlockIds.find((group) => group.type === type);
        if (group) {
          // Add blockId only if group is not collapsed
          if (!this.collapsedGroups.includes(type)) {
            group.blockIds.push(blockId);
          }
          // Increment count irrespective of whether it is collapsed or not
          group.count = (group.count ?? 0) + 1;
        }
      }
    });

    return groupBlockIds;
  };
}
