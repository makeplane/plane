// Re-exporting from here to avoid import changes in other files
// TODO: Remove this once all the imports are updated
import { EProjectStateGroup, EProjectPriority, EProjectAccess, EProjectStateLoader } from "@plane/constants";
import {
  TProjectStateLoader as TProjectStateLoaderExport,
  TProjectStateDraggableData as TProjectStateDraggableDataExport,
  TProjectStateGroupKey as TProjectStateGroupKeyExport,
  TProjectState as TProjectStateExport,
  TProjectStateIdsByGroup as TProjectStateIdsByGroupExport,
  TProjectStatesByGroup as TProjectStatesByGroupExport,
} from "@plane/types";

export { EProjectStateGroup, EProjectPriority, EProjectAccess, EProjectStateLoader };

export type TProjectStateLoader = TProjectStateLoaderExport;

export type TProjectStateDraggableData = TProjectStateDraggableDataExport;

export type TProjectStateGroupKey = TProjectStateGroupKeyExport;

export type TProjectState = TProjectStateExport;

export type TProjectStateIdsByGroup = TProjectStateIdsByGroupExport;

export type TProjectStatesByGroup = TProjectStatesByGroupExport;
