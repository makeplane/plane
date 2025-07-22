import isNil from "lodash/isNil";
import set from "lodash/set";
// plane imports
import { ChartDataType, IGanttBlock, TIssueRelationMap } from "@plane/types";
// components
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { getItemPositionWidth } from "@/components/gantt-chart/views";
// Plane-web
import { EDependencyPosition, ETimelineRelation } from "@/plane-web/constants";
import { DependencyTree, Relation, TIssueRelationTypes } from "@/plane-web/types";

/**
 * Dependency details for each relation ship type, Used while building dependency tree
 */
const TIMELINE_DEPENDENCIES: {
  [key in TIssueRelationTypes]?: {
    dependencyIndicator: 1 | -1;
    parentDependency: EDependencyPosition;
    childDependency: EDependencyPosition;
  };
} = {
  blocked_by: {
    dependencyIndicator: -1,
    parentDependency: EDependencyPosition.START,
    childDependency: EDependencyPosition.END,
  },
  blocking: {
    dependencyIndicator: 1,
    parentDependency: EDependencyPosition.END,
    childDependency: EDependencyPosition.START,
  },
  start_before: {
    dependencyIndicator: 1,
    parentDependency: EDependencyPosition.START,
    childDependency: EDependencyPosition.START,
  },
  start_after: {
    dependencyIndicator: -1,
    parentDependency: EDependencyPosition.START,
    childDependency: EDependencyPosition.START,
  },
  finish_before: {
    dependencyIndicator: 1,
    parentDependency: EDependencyPosition.END,
    childDependency: EDependencyPosition.END,
  },
  finish_after: {
    dependencyIndicator: -1,
    parentDependency: EDependencyPosition.END,
    childDependency: EDependencyPosition.END,
  },
};

/**
 * Map that define each relation type
 */
const RELATION_IDENTIFIER_MAP: {
  [key in TIssueRelationTypes]:
    | {
        originDependencyPosition: EDependencyPosition;
        destinationDependencyPosition: EDependencyPosition;
        originDependencyKey: keyof IGanttBlock;
        destinationDependencyKey: keyof IGanttBlock;
        relationType: ETimelineRelation;
        isParentOriginBlock: boolean;
      }
    | undefined;
} = {
  blocked_by: {
    originDependencyPosition: EDependencyPosition.END,
    destinationDependencyPosition: EDependencyPosition.START,
    originDependencyKey: "target_date",
    destinationDependencyKey: "start_date",
    relationType: ETimelineRelation.FS,
    isParentOriginBlock: false,
  },
  blocking: {
    originDependencyPosition: EDependencyPosition.END,
    destinationDependencyPosition: EDependencyPosition.START,
    originDependencyKey: "target_date",
    destinationDependencyKey: "start_date",
    relationType: ETimelineRelation.FS,
    isParentOriginBlock: true,
  },
  start_before: {
    originDependencyPosition: EDependencyPosition.START,
    destinationDependencyPosition: EDependencyPosition.START,
    originDependencyKey: "start_date",
    destinationDependencyKey: "start_date",
    relationType: ETimelineRelation.SS,
    isParentOriginBlock: true,
  },
  start_after: {
    originDependencyPosition: EDependencyPosition.START,
    destinationDependencyPosition: EDependencyPosition.START,
    originDependencyKey: "start_date",
    destinationDependencyKey: "start_date",
    relationType: ETimelineRelation.SS,
    isParentOriginBlock: false,
  },
  finish_before: {
    originDependencyPosition: EDependencyPosition.END,
    destinationDependencyPosition: EDependencyPosition.END,
    originDependencyKey: "target_date",
    destinationDependencyKey: "target_date",
    relationType: ETimelineRelation.FF,
    isParentOriginBlock: true,
  },
  finish_after: {
    originDependencyPosition: EDependencyPosition.END,
    destinationDependencyPosition: EDependencyPosition.END,
    originDependencyKey: "target_date",
    destinationDependencyKey: "target_date",
    relationType: ETimelineRelation.FF,
    isParentOriginBlock: false,
  },
  duplicate: undefined,
  relates_to: undefined,
};

/**
 * This method returns a map of Relation calculated from based on relationShip
 * @param affectedBlockIds Block Ids for which the relations are calculated
 * @param allBlockIds All the block Ids on the Timeline charts
 * @param blocksMap Map of Blocks
 * @param relationsMap Map of relationship from the relation store
 * @returns
 */
export function getNewRelationsMap(
  affectedBlockIds: string[],
  allBlockIds: string[],
  blocksMap: Record<string, IGanttBlock>,
  relationsMap: TIssueRelationMap
): Record<string, Relation> {
  const newRelationsMap: Record<string, Relation> = {};
  // loop through all the affected block Ids
  affectedBlockIds.forEach((blockId) => {
    const currBlockIndex = allBlockIds.indexOf(blockId);
    const currBlock = blocksMap[blockId];
    const relation = relationsMap[blockId];

    const isCurrBlockVisible = !!currBlock?.start_date || !!currBlock?.target_date;

    // if the blocks has no relations, and block not visible on the chart then return
    if (!relation || currBlockIndex < 0 || !isCurrBlockVisible) return;

    const relationKeys = Object.keys(relation);

    // Loop through all the relation ship types available for the current block
    for (const relationKey of relationKeys) {
      const relatingIds = relation[relationKey as TIssueRelationTypes];
      const currRelationData = RELATION_IDENTIFIER_MAP[relationKey as TIssueRelationTypes];

      // if there are no related block Ids of the type the return
      if (!relatingIds || !Array.isArray(relatingIds) || !currRelationData) continue;

      const {
        originDependencyPosition,
        destinationDependencyPosition,
        originDependencyKey,
        destinationDependencyKey,
        relationType,
        isParentOriginBlock,
      } = currRelationData;

      // Loop through all the related block Ids of the current relation
      for (const blockId of relatingIds) {
        const relatingBlock = blocksMap[blockId];
        const relatingBlockIndex = allBlockIds.indexOf(blockId);

        const isRelatingBlockVisible = !!relatingBlock?.start_date || !!relatingBlock?.target_date;

        // if block data does not exist and block not visible on the chart then return
        if (!relatingBlock || relatingBlockIndex < 0 || !isRelatingBlockVisible) continue;

        let originBlock, destinationBlock, originBlockIndex, destinationBlockIndex;

        // Determine the originating block and destination block
        if (isParentOriginBlock) {
          originBlock = currBlock;
          destinationBlock = relatingBlock;
          originBlockIndex = currBlockIndex;
          destinationBlockIndex = relatingBlockIndex;
        } else {
          originBlock = relatingBlock;
          destinationBlock = currBlock;
          originBlockIndex = relatingBlockIndex;
          destinationBlockIndex = currBlockIndex;
        }

        if (!originBlock[originDependencyKey] || !destinationBlock[destinationDependencyKey]) continue;

        const relationId = `${originBlock.id}_${destinationBlock.id}`;

        // Calculate Start and end co-ordinates of the relation
        const startX =
          originDependencyPosition === EDependencyPosition.START
            ? (originBlock.position?.marginLeft ?? 0)
            : (originBlock.position?.marginLeft ?? 0) + (originBlock.position?.width ?? 0);
        const endX =
          destinationDependencyPosition === EDependencyPosition.START
            ? (destinationBlock.position?.marginLeft ?? 0)
            : (destinationBlock.position?.marginLeft ?? 0) + (destinationBlock.position?.width ?? 0);

        const startPosition = {
          x: startX,
          y: (originBlockIndex + 0.5) * BLOCK_HEIGHT + (originBlock.meta?.index ?? 0) * BLOCK_HEIGHT,
        };

        const endPosition = {
          x: endX,
          y: (destinationBlockIndex + 0.5) * BLOCK_HEIGHT + (destinationBlock.meta?.index ?? 0) * BLOCK_HEIGHT,
        };

        const relationObject: Relation = {
          id: relationId,
          startPosition,
          endPosition,
          originDependencyPosition,
          destinationDependencyPosition,
          originBlock: originBlock.id,
          destinationBlock: destinationBlock.id,
          relationType,
          isAdhering: endPosition.x >= startPosition.x,
          projectId: currBlock.meta?.project_id,
        };

        // Add it to the newRelationsMap
        set(newRelationsMap, [relationId], relationObject);
      }
    }
  });

  return newRelationsMap;
}

/**
 * Build a dependency tree while moving the blocks to see if any of the dependencies are affected
 * @param id root Block Id
 * @param blocksMap blocks map
 * @param relationsMap relationship Map
 * @param chartDataType current chart data
 * @param ignoreDependencies if true just return the root block's data
 * @param processedMap Map to keep track of all the blocks that are already processed to avoid cyclical dependencies
 * @returns
 */
export function buildDependencyTree(
  id: string,
  blocksMap: Record<string, IGanttBlock>,
  relationsMap: TIssueRelationMap,
  chartDataType: ChartDataType,
  ignoreDependencies = false,
  processedMap: { [key: string]: true } = {}
): DependencyTree | undefined {
  const currBlock = blocksMap[id];

  if (!currBlock) return;

  // get original positions based on block dates
  const originalPosition = getItemPositionWidth(chartDataType, currBlock);

  const originalValues = {
    [EDependencyPosition.START]: originalPosition?.marginLeft ?? 0,
    [EDependencyPosition.END]: (originalPosition?.marginLeft ?? 0) + (originalPosition?.width ?? 0),
  };

  processedMap[id] = true;

  // get child dependencies for the block
  const childDependencies = ignoreDependencies
    ? []
    : getDependencyChildren(id, blocksMap, chartDataType, originalValues, relationsMap, processedMap);

  return {
    dependencyId: id,
    [EDependencyPosition.START]: currBlock.position?.marginLeft ?? 0,
    [EDependencyPosition.END]: (currBlock.position?.marginLeft ?? 0) + (currBlock.position?.width ?? 0),
    originalValues,
    dependencies: childDependencies,
  };
}

/**
 * get all the dependent children for the block
 * This is a recursive method that is done with breadth first approach
 * @param id parent block
 * @param blocksMap blocksMap
 * @param chartDataType current chart data
 * @param parentOriginalValues original positions of the parent block before drg
 * @param relationsMap relation Map
 * @param processedMap Map to keep track of all the blocks that are already processed to avoid cyclical dependencies
 * @returns
 */
const getDependencyChildren = (
  id: string,
  blocksMap: Record<string, IGanttBlock>,
  chartDataType: ChartDataType,
  parentOriginalValues: { [key in EDependencyPosition]: number },
  relationsMap: TIssueRelationMap,
  processedMap: { [key: string]: true } = {}
) => {
  const currRelations = relationsMap[id];

  const dependencies: DependencyTree[] = [];

  if (!currRelations) return [];

  const timeLineRelations = Object.keys(TIMELINE_DEPENDENCIES) as TIssueRelationTypes[];
  // loop through all the available timeline relations
  for (const timeLineRelation of timeLineRelations) {
    const currRelation = currRelations[timeLineRelation];

    if (currRelation && Array.isArray(currRelation)) {
      // loop through all the children relation blockIds
      for (const relationBlockId of currRelation) {
        const currBlock = blocksMap[relationBlockId];

        if (!currBlock || processedMap[relationBlockId]) continue;

        const originalPosition = getItemPositionWidth(chartDataType, currBlock);

        // Add the children dependencies to the dependencies list
        dependencies.push({
          ...(timeLineRelation && TIMELINE_DEPENDENCIES[timeLineRelation]),
          dependencyId: relationBlockId,
          [EDependencyPosition.START]: currBlock.position?.marginLeft ?? 0,
          [EDependencyPosition.END]: (currBlock.position?.marginLeft ?? 0) + (currBlock.position?.width ?? 0),
          originalValues: {
            [EDependencyPosition.START]: originalPosition?.marginLeft ?? 0,
            [EDependencyPosition.END]: (originalPosition?.marginLeft ?? 0) + (originalPosition?.width ?? 0),
          },
          dependencies: [],
        });
      }
    }
  }

  // sort all the dependencies, based on how close the dependent block is to the parent block
  dependencies.sort((a: DependencyTree, b: DependencyTree) => {
    const aDistance = getChildDependencyDistance(a, parentOriginalValues);
    const bDistance = getChildDependencyDistance(b, parentOriginalValues);

    return aDistance - bDistance;
  });

  // loop through the children to add their children through recursion
  for (const dependency of dependencies) {
    processedMap[dependency.dependencyId] = true;
    dependency.dependencies = getDependencyChildren(
      dependency.dependencyId,
      blocksMap,
      chartDataType,
      dependency.originalValues,
      relationsMap,
      processedMap
    );
  }

  return dependencies;
};

/**
 * Get the origin block's position to the child block's position
 * @param childDependencyTree
 * @param parentOriginalValues
 * @returns
 */
const getChildDependencyDistance = (
  childDependencyTree: DependencyTree,
  parentOriginalValues: { [key in EDependencyPosition]: number }
) => {
  const { parentDependency, childDependency, originalValues } = childDependencyTree;

  if (!childDependency || !parentDependency) return 0;

  return Math.abs(originalValues[childDependency] - parentOriginalValues[parentDependency]);
};

/**
 * Get all the position updates of the blocks while dragging based on dependencyTree
 * @param dependencyTree dependency tree
 * @param deltaLeft number
 * @param deltaWidth number
 * @returns
 */
export const getBlockUpdates = (
  dependencyTree: DependencyTree,
  deltaLeft: number,
  deltaWidth: number
): { blockId: string; marginLeft: number; width?: number }[] => {
  const currMarginLeft = dependencyTree[EDependencyPosition.START] + deltaLeft;
  const currWidth = dependencyTree[EDependencyPosition.END] - dependencyTree[EDependencyPosition.START] + deltaWidth;
  // Add all the current block to the block updates
  const currBlockUpdate: { blockId: string; marginLeft: number; width?: number } = {
    blockId: dependencyTree.dependencyId,
    marginLeft: currMarginLeft,
    width: currWidth,
  };

  let dependencyBlockUpdates = [currBlockUpdate];

  // If it contains dependencies then calculate updates for all the dependencies
  if (
    dependencyTree.dependencies &&
    Array.isArray(dependencyTree.dependencies) &&
    dependencyTree.dependencies.length > 0
  ) {
    const currOGValues = {
      [EDependencyPosition.START]: dependencyTree[EDependencyPosition.START],
      [EDependencyPosition.END]: dependencyTree[EDependencyPosition.END],
    };

    const currUpdatedValues = {
      [EDependencyPosition.START]: currMarginLeft,
      [EDependencyPosition.END]: currMarginLeft + currWidth,
    };

    // loop through to get all the block updates
    for (const dependency of dependencyTree.dependencies) {
      const currBlockUpdates = getChildBlockUpdates(dependency, currOGValues, currUpdatedValues);

      dependencyBlockUpdates = [...dependencyBlockUpdates, ...currBlockUpdates];
    }
  }

  return dependencyBlockUpdates;
};

/**
 * Recursive method to get all children block updates
 * @param dependencyTree
 * @param OGValues
 * @param updatedValues
 * @returns
 */
const getChildBlockUpdates = (
  dependencyTree: DependencyTree,
  OGValues: { [EDependencyPosition.START]: number; [EDependencyPosition.END]: number },
  updatedValues: { [EDependencyPosition.START]: number; [EDependencyPosition.END]: number }
): { blockId: string; marginLeft: number; width?: number }[] => {
  const { dependencyId, parentDependency, childDependency, dependencyIndicator, originalValues, dependencies } =
    dependencyTree;

  // return if there is no dependents
  if (!parentDependency || !childDependency || !dependencyIndicator) return [];

  const OGParentValue = OGValues[parentDependency];
  const updatedParentValue = updatedValues[parentDependency];

  const childDependentValue = dependencyTree[childDependency];

  const OGDelta = (OGParentValue - childDependentValue) * dependencyIndicator;
  const updatedDelta = (updatedParentValue - childDependentValue) * dependencyIndicator;

  const currBlockMovement =
    (dependencyTree[EDependencyPosition.START] - originalValues[EDependencyPosition.START]) * dependencyIndicator;

  // Main logic which determines if the current block is affected by the parent block's new position
  if (currBlockMovement <= 0 && (OGDelta > 0 || updatedDelta < 0)) return [];

  const comparatorMethod = dependencyIndicator > 0 ? Math.max : Math.min;
  // block update of the child block
  const currBlockUpdate = {
    blockId: dependencyId,
    marginLeft: comparatorMethod(
      originalValues[EDependencyPosition.START],
      dependencyTree[EDependencyPosition.START] + updatedDelta * dependencyIndicator
    ),
  };

  let dependencyBlockUpdates = [currBlockUpdate];

  // loop through all the child dependencies and call getChildBlockUpdates recursively
  if (dependencies && Array.isArray(dependencies) && dependencies.length > 0) {
    const currOGValues = {
      [EDependencyPosition.START]: dependencyTree[EDependencyPosition.START],
      [EDependencyPosition.END]: dependencyTree[EDependencyPosition.END],
    };

    const currUpdatedValues = {
      [EDependencyPosition.START]: dependencyTree[EDependencyPosition.START] + updatedDelta * dependencyIndicator,
      [EDependencyPosition.END]: dependencyTree[EDependencyPosition.END] + updatedDelta * dependencyIndicator,
    };

    for (const dependency of dependencies) {
      const currBlockUpdates = getChildBlockUpdates(dependency, currOGValues, currUpdatedValues);

      dependencyBlockUpdates = [...dependencyBlockUpdates, ...currBlockUpdates];
    }
  }

  return dependencyBlockUpdates;
};

/**
 * Get Relation type based on origin and destination position
 * @param draggedFromPosition
 * @param draggedOnPosition
 * @returns
 */
export function getRelationType(
  draggedFromPosition: EDependencyPosition,
  draggedOnPosition: EDependencyPosition
): TIssueRelationTypes | undefined {
  if (draggedFromPosition === EDependencyPosition.START) {
    return draggedOnPosition === EDependencyPosition.START ? "start_before" : undefined;
  } else {
    return draggedOnPosition === EDependencyPosition.START ? "blocking" : "finish_before";
  }
}

/**
 * Return position of block
 * @param blocksMap
 * @param blockIds
 * @param blockId
 * @param dependencyPosition
 * @returns
 */
export const getPositionOfBlock = (
  blocksMap: Record<string, IGanttBlock>,
  blockIds: string[] | undefined,
  blockId: string,
  dependencyPosition: EDependencyPosition
) => {
  const blockedByBlock = blocksMap[blockId];
  const blockedByIndex = blockIds?.indexOf(blockId);

  const positionIndex = blockedByBlock.meta?.index ?? 0;

  if (!blockedByBlock || isNil(blockedByIndex) || blockedByIndex < 0) return undefined;

  const position = {
    x: blockedByBlock.position?.marginLeft ?? 0,
    y: (blockedByIndex + 0.5) * BLOCK_HEIGHT + positionIndex * BLOCK_HEIGHT,
  };

  if (dependencyPosition === EDependencyPosition.END) {
    position.x += blockedByBlock.position?.width ?? 0;
  }

  return position;
};
