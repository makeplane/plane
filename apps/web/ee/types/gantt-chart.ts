import { EDependencyPosition, ETimelineRelation } from "../constants";

export type TIssueRelationTypes =
  | "blocking"
  | "blocked_by"
  | "duplicate"
  | "relates_to"
  | "start_before"
  | "start_after"
  | "finish_before"
  | "finish_after";

export type DependencyTree = {
  dependencyId: string;
  [EDependencyPosition.START]: number;
  [EDependencyPosition.END]: number;
  originalValues: {
    [EDependencyPosition.START]: number;
    [EDependencyPosition.END]: number;
  };
  parentDependency?: EDependencyPosition;
  childDependency?: EDependencyPosition;
  dependencyIndicator?: 1 | -1;
  dependencies: DependencyTree[];
};

export type Relation = {
  id: string;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  originDependencyPosition: EDependencyPosition;
  destinationDependencyPosition: EDependencyPosition;
  originBlock: string;
  destinationBlock: string;
  relationType: ETimelineRelation;
  isAdhering: boolean;
};

export type DependencyDraggingDetails = {
  startPosition: { x: number; y: number };
  dragPosition: { x: number; y: number };
  draggedFrom: string;
  draggedFromPosition: EDependencyPosition;
  draggedOn?: string;
  draggedOnPosition?: EDependencyPosition;
};
