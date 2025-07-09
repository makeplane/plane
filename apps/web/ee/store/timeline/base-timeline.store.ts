import flatten from "lodash/flatten";
import get from "lodash/get";
import set from "lodash/set";
import uniq from "lodash/uniq";
import { action, autorun, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
//
import { IBlockUpdateDependencyData } from "@plane/types";
import { renderFormattedPayloadDate } from "@plane/utils";
import {
  BaseTimeLineStore as ExtendableTimelineStore,
  IBaseTimelineStore as IExtendableTimelineStore,
} from "@/ce/store/timeline/base-timeline.store";
// components
import { getDateFromPositionOnGantt } from "@/components/gantt-chart/views";
// helpers
// Plane-web
import { EDependencyPosition } from "@/plane-web/constants";
import { DependencyDraggingDetails, Relation } from "@/plane-web/types";
import { RootStore } from "../root.store";
import { buildDependencyTree, getBlockUpdates, getNewRelationsMap, getPositionOfBlock, getRelationType } from "./utils";

export interface IBaseTimelineStore extends IExtendableTimelineStore {
  relationsMap: Record<string, Relation>;
  dependencyDraggingDetails: DependencyDraggingDetails | undefined;
  // computed
  relations: Relation[];
  // computed functions
  getRelatedBlockIds: (blockId: string) => string[];
  // action
  createDependency: () => Promise<void>;
  onDragStart: (blockId: string, dependencyPosition: EDependencyPosition) => void;
  onDrag: (position: { x: number; y: number }) => void;
  onDragOver: (blockId: string, dependencyPosition: EDependencyPosition) => void;
  onDragLeave: () => void;
  onDrop: () => void;
}

export class BaseTimeLineStore extends ExtendableTimelineStore implements IBaseTimelineStore {
  relationsMap: Record<string, Relation> = {};
  dependencyDraggingDetails: DependencyDraggingDetails | undefined = undefined;

  constructor(rootStore: RootStore) {
    super(rootStore);
    makeObservable(this, {
      relationsMap: observable,
      dependencyDraggingDetails: observable,
      isDependencyEnabled: observable.ref,
      // computed
      relations: computed,
      // actions
      createDependency: action,
      onDragStart: action,
      onDrag: action,
      onDragOver: action,
      onDragLeave: action,
      onDrop: action,
    });

    autorun(() => {
      this.isDependencyEnabled = this.rootStore.featureFlags.getFeatureFlagForCurrentWorkspace(
        "TIMELINE_DEPENDENCY",
        false
      );
    });

    autorun(() => {
      if (!this.blockIds) this.relationsMap = {};
    });

    // autorun to create local relationsMap
    autorun(() => {
      if (!this.blockIds || !Array.isArray(this.blockIds) || this.isDragging) return true;

      const blocksMap = this.blocksMap;
      const blockIds = this.blockIds;
      const relationsMap = this.rootStore.issue.issueDetail.relation.relationMap;

      const newRelationsMap: Record<string, Relation> = getNewRelationsMap(blockIds, blockIds, blocksMap, relationsMap);

      runInAction(() => {
        this.relationsMap = newRelationsMap;
      });
    });
  }

  get relations() {
    return Object.values(this.relationsMap);
  }

  /**
   * returns all the related block Ids to the provided blockId
   */
  getRelatedBlockIds = computedFn((blockId: string) => {
    const currRelation = this.rootStore.issue.issueDetail?.relation?.relationMap?.[blockId];

    if (!currRelation) return [];

    return flatten(Object.values(currRelation) ?? []);
  });

  /**
   * returns If the current Dependency is dragging
   */
  getIsCurrentDependencyDragging = computedFn(
    (blockId: string) => blockId === this.dependencyDraggingDetails?.draggedFrom
  );

  /**
   * Adds width on Chart position change while the blocks are being dragged
   * @param addedWidth
   */
  updateAllBlocksOnChartChangeWhileDragging = action((addedWidth: number) => {
    if (!this.blockIds || !this.isDragging) return;

    // update all the position with addedWidth
    runInAction(() => {
      this.blockIds?.forEach((blockId) => {
        const currBlock = this.blocksMap[blockId];

        if (!currBlock || !currBlock.position) return;

        currBlock.position.marginLeft += addedWidth;
      });
    });

    if (!this.isDependencyEnabled) return;

    runInAction(() => {
      if (this.dependencyDraggingDetails) {
        if (this.dependencyDraggingDetails.startPosition) {
          this.dependencyDraggingDetails.startPosition.x += addedWidth;
        }
        if (this.dependencyDraggingDetails.dragPosition) {
          this.dependencyDraggingDetails.dragPosition.x += addedWidth;
        }
      }
    });

    // update all relationship positions
    const relationsMap = this.rootStore.issue.issueDetail.relation.relationMap;
    const newRelationsMap: Record<string, Relation> = getNewRelationsMap(
      this.blockIds,
      this.blockIds,
      this.blocksMap,
      relationsMap
    );
    runInAction(() => {
      this.relationsMap = newRelationsMap;
    });
  });

  /**
   * returns updates dates of blocks post drag.
   * @param id
   * @param shouldUpdateHalfBlock if is a half block then update the incomplete block only if this is true
   * @returns
   */
  getUpdatedPositionAfterDrag = action(
    (id: string, shouldUpdateHalfBlock: boolean, shouldIgnoreDependencies = false) => {
      if (!this.currentViewData) return [];

      const ignoreDependencies = !this.isDependencyEnabled || shouldIgnoreDependencies;

      // Create a dependency tree with breadth first approach
      const dependencyTree = buildDependencyTree(
        id,
        this.blocksMap,
        this.rootStore.issue.issueDetail.relation.relationMap,
        this.currentViewData,
        ignoreDependencies
      );

      // get position updates by traversing the above tree
      const blockUpdates = dependencyTree ? getBlockUpdates(dependencyTree, 0, 0) : [];

      const blockNewDates: IBlockUpdateDependencyData[] = [];

      for (const blockUpdate of blockUpdates) {
        const block = this.blocksMap[blockUpdate.blockId];

        if (!block) continue;

        const newBlock: IBlockUpdateDependencyData = {
          id: block.id,
          project_id: block.data?.project_id,
        };

        // If shouldUpdateHalfBlock or the start date is available then update start date only for the dragging block
        if ((shouldUpdateHalfBlock && block.id === id) || block.start_date) {
          newBlock.start_date = renderFormattedPayloadDate(
            getDateFromPositionOnGantt(blockUpdate.marginLeft, this.currentViewData)
          );
        }
        // If shouldUpdateHalfBlock or the target date is available then update target date only for the dragging block
        if ((shouldUpdateHalfBlock && block.id === id) || block.target_date) {
          newBlock.target_date = renderFormattedPayloadDate(
            getDateFromPositionOnGantt(
              blockUpdate.marginLeft + (blockUpdate?.width ?? block?.position?.width ?? 0),
              this.currentViewData,
              -1
            )
          );
        }

        blockNewDates.push(newBlock);
      }

      return blockNewDates;
    }
  );

  /**
   * updates the block's position such as marginLeft and width wile dragging
   * @param id
   * @param deltaLeft
   * @param deltaWidth
   * @returns
   */
  updateBlockPosition = action(
    (id: string, deltaLeft: number, deltaWidth: number, shouldIgnoreDependencies = false) => {
      if (!this.currentViewData || !this.blockIds) return;

      const ignoreDependencies = !this.isDependencyEnabled || shouldIgnoreDependencies;

      // Create a dependency tree with breadth first approach
      const dependencyTree = buildDependencyTree(
        id,
        this.blocksMap,
        this.rootStore.issue.issueDetail.relation.relationMap,
        this.currentViewData,
        ignoreDependencies
      );

      const blocksMap = this.blocksMap;
      const allBlockIds = this.blockIds;
      const relationsMap = this.rootStore.issue.issueDetail.relation.relationMap;

      // get position updates by traversing the above tree
      const blockUpdates = dependencyTree ? getBlockUpdates(dependencyTree, deltaLeft, deltaWidth) : [];

      // Update all the affected block Ids with the new position
      runInAction(() => {
        for (const blockUpdate of blockUpdates) {
          const currPosition = get(this.blocksMap, [blockUpdate.blockId, "position"]);

          if (blockUpdate.width || currPosition?.marginLeft !== blockUpdate.marginLeft) {
            set(this.blocksMap, [blockUpdate.blockId, "position"], {
              marginLeft: blockUpdate.marginLeft ?? currPosition?.marginLeft,
              width: blockUpdate.width ?? currPosition?.width,
            });
          }
        }
      });

      // Calculate and update all the relations ships of the affected block Ids
      const affectedBlockIds = uniq(blockUpdates.map((blockUpdate) => blockUpdate.blockId));
      const newRelationIterable = Object.entries(
        getNewRelationsMap(affectedBlockIds, allBlockIds, blocksMap, relationsMap)
      );
      runInAction(() => {
        for (const [relationKey, relation] of newRelationIterable) {
          set(this.relationsMap, [relationKey], relation);
        }
      });
    }
  );

  /**
   * Method to create dependency
   * @returns
   */
  createDependency = async () => {
    const { draggedFrom, draggedOn, draggedFromPosition, draggedOnPosition } = this.dependencyDraggingDetails ?? {};

    if (!draggedFrom || !draggedOn || !draggedFromPosition || !draggedOnPosition) return;

    const relationType = getRelationType(draggedFromPosition, draggedOnPosition);

    if (!relationType) return;

    await this.rootStore.issue.issueDetail.relation.createCurrentRelation(draggedFrom, relationType, draggedOn);
  };

  // Dependency Dragging methods, used while dragging the dependency lines
  /**
   * On Drag start
   * @param blockId
   * @param dependencyPosition
   * @returns
   */
  onDragStart = (blockId: string, dependencyPosition: EDependencyPosition) => {
    const startPosition = getPositionOfBlock(this.blocksMap, this.blockIds, blockId, dependencyPosition);

    if (!startPosition) return;

    runInAction(() => {
      this.dependencyDraggingDetails = {
        startPosition: { ...startPosition },
        dragPosition: { ...startPosition },
        draggedFrom: blockId,
        draggedFromPosition: dependencyPosition,
      };
    });
  };

  /**
   * Called on each drag
   * @param position
   * @returns
   */
  onDrag = (position: { x: number; y: number }) => {
    const startPosition = this.dependencyDraggingDetails?.startPosition;

    if (!this.isDragging || !startPosition) return;

    runInAction(() => {
      if (
        this.dependencyDraggingDetails &&
        !this.dependencyDraggingDetails.draggedOn &&
        !this.dependencyDraggingDetails.draggedOnPosition
      ) {
        this.dependencyDraggingDetails.dragPosition = {
          x: position.x,
          y: position.y,
        };
      }
    });
  };

  /**
   * Called when dragged over another dependency block
   * @param blockId
   * @param dependencyPosition
   * @returns
   */
  onDragOver = (blockId: string, dependencyPosition: EDependencyPosition) => {
    if (!this.isDragging) return;

    const dragPosition = getPositionOfBlock(this.blocksMap, this.blockIds, blockId, dependencyPosition);

    if (!dragPosition) return;
    runInAction(() => {
      if (this.dependencyDraggingDetails) {
        this.dependencyDraggingDetails = {
          ...this.dependencyDraggingDetails,
          dragPosition,
          draggedOn: blockId,
          draggedOnPosition: dependencyPosition,
        };
      }
    });
  };

  /**
   * Called when the mouse leaves the dependency block
   */
  onDragLeave = () => {
    runInAction(() => {
      if (this.dependencyDraggingDetails) {
        this.dependencyDraggingDetails = {
          ...this.dependencyDraggingDetails,
          draggedOn: undefined,
          draggedOnPosition: undefined,
        };
      }
    });
  };

  /**
   * Called on drop to clear the dragging state
   */
  onDrop = () => {
    runInAction(() => {
      this.dependencyDraggingDetails = undefined;
    });
  };
}
