/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import type { Connection, Edge, EdgeChange, Node, NodeChange, NodeProps } from "@xyflow/react";
import { Background, BackgroundVariant, Controls, Handle, MarkerType, Position, ReactFlow } from "@xyflow/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { StateGroupIcon } from "@plane/propel/icons";
import { Switch } from "@plane/propel/switch";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { IState, TStateGroups } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

// eslint-disable-next-line import/no-unassigned-import
import "@xyflow/react/dist/style.css";

const GROUP_ORDER: TStateGroups[] = ["backlog", "unstarted", "started", "completed", "cancelled"];
const COLUMN_WIDTH = 260;
const NODE_VERTICAL_GAP = 110;
const NODE_TOP_OFFSET = 24;

type TNodePositions = Record<string, { x: number; y: number }>;

const positionsStorageKey = (projectId: string) => `plane-workflow-graph-positions-${projectId}`;

const readStoredPositions = (projectId: string): TNodePositions => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(positionsStorageKey(projectId)) ?? "{}");
  } catch {
    return {};
  }
};

const writeStoredPositions = (projectId: string, positions: TNodePositions) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(positionsStorageKey(projectId), JSON.stringify(positions));
  } catch {
    // ignore quota / serialization errors — positions are a convenience, not critical data
  }
};

type TWorkflowGraphProps = {
  workspaceSlug: string;
  projectId: string;
  isEditable: boolean;
};

type TStateNodeData = {
  state: IState;
  isEditable: boolean;
  hasOutgoingRestrictions: boolean;
  onToggleAllowAny: (stateId: string, value: boolean) => void;
  [key: string]: unknown;
};

type TStateNode = Node<TStateNodeData, "stateNode">;

const StateNode = observer(function StateNode(props: NodeProps<TStateNode>) {
  const { data } = props;
  const { state, isEditable, hasOutgoingRestrictions, onToggleAllowAny } = data;
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "shadow-sm w-56 rounded-md border border-subtle bg-surface-1 p-3 transition-colors",
        state.allow_any_transition && "border-accent-primary/60"
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !bg-accent-primary" />
      <div className="flex items-center gap-2">
        <StateGroupIcon stateGroup={state.group} color={state.color} className="h-4 w-4 flex-shrink-0" />
        <span className="flex-grow truncate text-13 font-medium text-primary">{state.name}</span>
      </div>
      <div className="nodrag mt-2 flex items-center justify-between gap-2">
        <Tooltip tooltipContent={t("workflows.status_workflow.allow_any_transition_tooltip")} position="bottom">
          <span className="truncate text-11 text-tertiary">{t("workflows.status_workflow.allow_any_transition")}</span>
        </Tooltip>
        <Switch
          value={!!state.allow_any_transition}
          onChange={(value) => onToggleAllowAny(state.id, value)}
          disabled={!isEditable}
          size="sm"
        />
      </div>
      {!hasOutgoingRestrictions && (
        <div className="mt-1.5 text-11 text-placeholder italic">
          {t("workflows.status_workflow.unrestricted_outgoing")}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !bg-accent-primary" />
    </div>
  );
});

const nodeTypes = { stateNode: StateNode };

export const WorkflowGraph = observer(function WorkflowGraph(props: TWorkflowGraphProps) {
  const { workspaceSlug, projectId, isEditable } = props;
  // hooks
  const { t } = useTranslation();
  const { getProjectStates, transitionMap, updateStateTransitions, updateState } = useProjectState();
  // derived values
  const projectStates = getProjectStates(projectId) ?? [];
  const projectTransitionMap = transitionMap[projectId] ?? {};
  // per-project node layout, persisted locally so the arrangement survives reloads
  const [positions, setPositions] = useState<TNodePositions>(() => readStoredPositions(projectId));
  // tracks whether an in-progress edge reconnection landed on a valid handle
  const edgeReconnectSuccessful = useRef(true);

  // Handlers and derived collections are recomputed each render on purpose: the
  // component is a MobX `observer`, so it only re-renders when the observables it
  // reads change, and ReactFlow reconciles nodes/edges by id.
  const notifyUpdateError = () =>
    setToast({
      type: TOAST_TYPE.ERROR,
      title: t("common.error.label"),
      message: t("workflows.status_workflow.update_error"),
    });

  const handleToggleAllowAny = async (stateId: string, value: boolean) => {
    try {
      await updateState(workspaceSlug, projectId, stateId, { allow_any_transition: value });
    } catch {
      notifyUpdateError();
    }
  };

  const persistTransitions = async (fromStateId: string, toStateIds: string[]) => {
    try {
      await updateStateTransitions(workspaceSlug, projectId, { transitions: { [fromStateId]: toStateIds } });
    } catch {
      notifyUpdateError();
    }
  };

  const nodes: TStateNode[] = GROUP_ORDER.flatMap((group, columnIndex) => {
    const groupStates = projectStates.filter((state) => state.group === group);
    return groupStates.map((state, rowIndex) => ({
      id: state.id,
      type: "stateNode" as const,
      position: positions[state.id] ?? {
        x: columnIndex * COLUMN_WIDTH,
        y: NODE_TOP_OFFSET + rowIndex * NODE_VERTICAL_GAP,
      },
      data: {
        state,
        isEditable,
        hasOutgoingRestrictions: (projectTransitionMap[state.id] ?? []).length > 0,
        onToggleAllowAny: handleToggleAllowAny,
      },
      deletable: false,
      connectable: isEditable,
    }));
  });

  const edges: Edge[] = Object.entries(projectTransitionMap).flatMap(([fromStateId, toStateIds]) =>
    toStateIds.map((toStateId) => ({
      id: `${fromStateId}__${toStateId}`,
      source: fromStateId,
      target: toStateId,
      deletable: isEditable,
      reconnectable: isEditable,
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    }))
  );

  const handleNodesChange = (changes: NodeChange[]) => {
    // Track live drag positions so nodes move smoothly with controlled `nodes`.
    const positionChanges = changes.filter(
      (change): change is Extract<NodeChange, { type: "position" }> => change.type === "position" && !!change.position
    );
    if (positionChanges.length === 0) return;
    setPositions((prev) => {
      const next = { ...prev };
      positionChanges.forEach((change) => {
        if (change.position) next[change.id] = change.position;
      });
      return next;
    });
  };

  const handleNodeDragStop = () => {
    // Persist once the drag settles rather than on every mouse move.
    setPositions((prev) => {
      writeStoredPositions(projectId, prev);
      return prev;
    });
  };

  const handleConnect = (connection: Connection) => {
    if (!isEditable || !connection.source || !connection.target) return;
    if (connection.source === connection.target) return;
    const outgoing = projectTransitionMap[connection.source] ?? [];
    if (outgoing.includes(connection.target)) return;
    void persistTransitions(connection.source, [...outgoing, connection.target]);
  };

  const handleReconnectStart = () => {
    edgeReconnectSuccessful.current = false;
  };

  const handleReconnect = (oldEdge: Edge, newConnection: Connection) => {
    if (!isEditable) return;
    edgeReconnectSuccessful.current = true;
    const oldSource = oldEdge.source;
    const oldTarget = oldEdge.target;
    const newSource = newConnection.source;
    const newTarget = newConnection.target;

    // Reconnected onto an invalid target — treat as a removal of the old edge.
    if (!newSource || !newTarget || newSource === newTarget) {
      void persistTransitions(
        oldSource,
        (projectTransitionMap[oldSource] ?? []).filter((id) => id !== oldTarget)
      );
      return;
    }

    if (oldSource === newSource) {
      // Same source: swap the target within one bulk-replace call.
      const next = (projectTransitionMap[oldSource] ?? []).filter((id) => id !== oldTarget);
      if (!next.includes(newTarget)) next.push(newTarget);
      void persistTransitions(oldSource, next);
    } else {
      // Endpoint moved to a different source state.
      void persistTransitions(
        oldSource,
        (projectTransitionMap[oldSource] ?? []).filter((id) => id !== oldTarget)
      );
      const newOutgoing = projectTransitionMap[newSource] ?? [];
      if (!newOutgoing.includes(newTarget)) void persistTransitions(newSource, [...newOutgoing, newTarget]);
    }
  };

  const handleReconnectEnd = (_event: MouseEvent | TouchEvent, edge: Edge) => {
    // Dropped in empty space (no valid handle) — drop the connection.
    if (isEditable && !edgeReconnectSuccessful.current) {
      void persistTransitions(
        edge.source,
        (projectTransitionMap[edge.source] ?? []).filter((id) => id !== edge.target)
      );
    }
    edgeReconnectSuccessful.current = true;
  };

  const handleEdgesChange = (changes: EdgeChange[]) => {
    if (!isEditable) return;
    const removals = changes.filter((change) => change.type === "remove");
    if (removals.length === 0) return;
    // Group removed edges by source state and persist the remaining targets.
    const removedBySource = new Map<string, Set<string>>();
    removals.forEach((change) => {
      const [source, target] = change.id.split("__");
      if (!source || !target) return;
      if (!removedBySource.has(source)) removedBySource.set(source, new Set());
      removedBySource.get(source)?.add(target);
    });
    removedBySource.forEach((removedTargets, source) => {
      const remaining = (projectTransitionMap[source] ?? []).filter((target) => !removedTargets.has(target));
      void persistTransitions(source, remaining);
    });
  };

  return (
    <div className="h-[calc(100vh-280px)] min-h-96 w-full rounded-md border border-subtle">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onConnect={handleConnect}
        onEdgesChange={handleEdgesChange}
        onNodesChange={handleNodesChange}
        onNodeDragStop={handleNodeDragStop}
        onReconnectStart={handleReconnectStart}
        onReconnect={handleReconnect}
        onReconnectEnd={handleReconnectEnd}
        nodesDraggable
        nodesConnectable={isEditable}
        elementsSelectable={isEditable}
        edgesFocusable={isEditable}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
});
