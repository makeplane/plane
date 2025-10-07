"use client";

import { useEffect } from "react";
import { cloneDeep } from "lodash-es";
// plane imports
import { LIVE_BASE_PATH, LIVE_BASE_URL } from "@plane/constants";
import { IState, TIssue, TIssueParams } from "@plane/types";
import { useUser } from "@/hooks/store/user";
// root store
import { rootStore } from "@/lib/store-context";
import { EIssueGroupedAction } from "@/store/issue/helpers/base-issues.store";

const MAX_RECONNECT_INTERVAL = 30000;
const INITIAL_RECONNECT_INTERVAL = 1000;
const GROUPED_LIST_EVENT_PATTERN = /^(issue|module|cycle|issue_relation|issue_vote|issue_reaction)\./;

type AppliedProjectViewFilters = Partial<Record<TIssueParams, string | boolean>> | undefined;

const IGNORED_PROJECT_VIEW_FILTER_KEYS: Set<TIssueParams> = new Set([
  "group_by",
  "sub_group_by",
  "order_by",
  "cursor",
  "per_page",
  "layout",
  "expand",
  "show_empty_groups",
  "type",
]);

const SUPPORTED_PROJECT_VIEW_FILTER_KEYS: Set<TIssueParams> = new Set([
  "priority",
  "state",
  "state_group",
  "assignees",
  "created_by",
  "labels",
  "cycle",
  "module",
  "project",
  "issue_type",
  "sub_issue",
]);

type IssueFieldExtractor = (issue: TIssue, stateMap?: Record<string, IState>) => string[];

const FIELD_EXTRACTORS: Record<string, IssueFieldExtractor> = {
  priority: (issue) => toNormalizedValueList(issue.priority),
  state: (issue) => toNormalizedValueList(issue.state_id),
  state_group: (issue, stateMap) => toNormalizedValueList(resolveStateGroup(issue, stateMap)),
  assignees: (issue) => toNormalizedValueList(issue.assignee_ids),
  created_by: (issue) => toNormalizedValueList(issue.created_by),
  labels: (issue) => toNormalizedValueList(issue.label_ids),
  cycle: (issue) => toNormalizedValueList(issue.cycle_id),
  module: (issue) => toNormalizedValueList(issue.module_ids),
  project: (issue) => toNormalizedValueList(issue.project_id),
  issue_type: (issue) => toNormalizedValueList(issue.type_id),
};

const normalizeFilterValue = (value: string | null | undefined): string =>
  value === null || value === undefined || value === "" ? "None" : String(value);

const parseCommaSeparatedValues = (value: string | boolean): string[] => {
  if (typeof value !== "string") return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const toNormalizedValueList = (value: string | string[] | null | undefined): string[] => {
  if (!value || (Array.isArray(value) && value.length === 0)) return ["None"];

  if (Array.isArray(value)) return value.map((entry) => normalizeFilterValue(entry));

  return [normalizeFilterValue(value)];
};

const resolveStateGroup = (issue: TIssue, stateMap: Record<string, IState> | undefined): string | null => {
  if (issue.state__group) return issue.state__group;
  if (!issue.state_id || !stateMap) return null;

  const state = stateMap[issue.state_id];
  return state?.group ?? null;
};

const FILTER_PROPERTY_UNSUPPORTED = Symbol("FILTER_PROPERTY_UNSUPPORTED");
const FILTER_EVALUATION_UNSUPPORTED = Symbol("FILTER_EVALUATION_UNSUPPORTED");

const WORK_ITEM_FILTER_PROPERTY_EXTRACTORS: Record<
  string,
  (issue: TIssue, stateMap?: Record<string, IState>) => string | string[] | null | undefined
> = {
  state_group: (issue, stateMap) => resolveStateGroup(issue, stateMap),
  priority: (issue) => issue.priority,
  start_date: (issue) => issue.start_date,
  target_date: (issue) => issue.target_date,
  assignee_id: (issue) => issue.assignee_ids ?? [],
  created_by_id: (issue) => issue.created_by,
  label_id: (issue) => issue.label_ids ?? [],
  state_id: (issue) => issue.state_id,
  cycle_id: (issue) => issue.cycle_id,
  module_id: (issue) => issue.module_ids ?? [],
  project_id: (issue) => issue.project_id,
  issue_type_id: (issue) => issue.type_id,
};

const SUPPORTED_WORK_ITEM_FILTER_PROPERTIES = new Set(Object.keys(WORK_ITEM_FILTER_PROPERTY_EXTRACTORS));

const normalizeFilterOperandValue = (value: string): string => {
  if (!value) return "None";
  const lower = value.toLowerCase();
  if (lower === "null" || lower === "none") return "None";
  return value;
};

const toComparableList = (value: string | string[] | null | undefined): string[] => {
  if (Array.isArray(value)) {
    if (value.length === 0) return ["None"];
    return value.map((entry) => normalizeFilterValue(entry));
  }
  return [normalizeFilterValue(value)];
};

const parseDateBound = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === "null" || normalized === "none") return undefined;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : timestamp;
};

const getIssueDateTimestamp = (value: string | string[] | null | undefined): number | null => {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return null;
  const timestamp = Date.parse(candidate);
  return Number.isNaN(timestamp) ? null : timestamp;
};

const getWorkItemFilterPropertyValue = (
  issue: TIssue,
  property: string,
  stateMap: Record<string, IState> | undefined
): string | string[] | null | undefined | typeof FILTER_PROPERTY_UNSUPPORTED => {
  const extractor = WORK_ITEM_FILTER_PROPERTY_EXTRACTORS[property];
  if (!extractor) return FILTER_PROPERTY_UNSUPPORTED;
  return extractor(issue, stateMap);
};

const evaluateRangeCondition = (
  issueValue: string | string[] | null | undefined,
  rawTokens: string[]
): boolean => {
  const timestamp = getIssueDateTimestamp(issueValue);
  if (timestamp === null) return false;

  const [startToken, endToken] = rawTokens;
  const lowerBound = parseDateBound(startToken);
  const upperBound = parseDateBound(endToken);

  if (lowerBound !== undefined && timestamp < lowerBound) return false;
  if (upperBound !== undefined && timestamp > upperBound) return false;

  return true;
};

const evaluateWorkItemFilterCondition = (
  rawKey: string,
  rawValue: unknown,
  issue: TIssue,
  stateMap: Record<string, IState> | undefined
): boolean | typeof FILTER_EVALUATION_UNSUPPORTED => {
  if (typeof rawValue !== "string") return FILTER_EVALUATION_UNSUPPORTED;

  const separatorIndex = rawKey.lastIndexOf("__");
  if (separatorIndex === -1) return FILTER_EVALUATION_UNSUPPORTED;

  const property = rawKey.slice(0, separatorIndex);
  const operator = rawKey.slice(separatorIndex + 2);

  if (!SUPPORTED_WORK_ITEM_FILTER_PROPERTIES.has(property)) return FILTER_EVALUATION_UNSUPPORTED;

  const issuePropertyValue = getWorkItemFilterPropertyValue(issue, property, stateMap);
  if (issuePropertyValue === FILTER_PROPERTY_UNSUPPORTED) return FILTER_EVALUATION_UNSUPPORTED;

  const filterTokensRaw = parseCommaSeparatedValues(rawValue);
  const tokens = filterTokensRaw.length > 0 ? filterTokensRaw : [rawValue];

  switch (operator) {
    case "exact":
    case "in": {
      const normalizedFilterValues = tokens.map((token) => normalizeFilterOperandValue(token));
      const issueValues = toComparableList(issuePropertyValue);
      return issueValues.some((issueValue) => normalizedFilterValues.includes(issueValue));
    }

    case "range": {
      return evaluateRangeCondition(issuePropertyValue, tokens);
    }

    default:
      return FILTER_EVALUATION_UNSUPPORTED;
  }
};

const evaluateWorkItemFilterNode = (
  node: unknown,
  issue: TIssue,
  stateMap: Record<string, IState> | undefined
): boolean | typeof FILTER_EVALUATION_UNSUPPORTED => {
  if (!node) return true;

  if (Array.isArray(node)) {
    for (const child of node) {
      const result = evaluateWorkItemFilterNode(child, issue, stateMap);
      if (result === FILTER_EVALUATION_UNSUPPORTED) return FILTER_EVALUATION_UNSUPPORTED;
      if (!result) return false;
    }
    return true;
  }

  if (typeof node !== "object") return true;

  const entries = Object.entries(node as Record<string, unknown>);
  if (entries.length === 0) return true;

  const andGroup = (node as Record<string, unknown>)["and"];
  if (Array.isArray(andGroup)) {
    for (const child of andGroup) {
      const result = evaluateWorkItemFilterNode(child, issue, stateMap);
      if (result === FILTER_EVALUATION_UNSUPPORTED) return FILTER_EVALUATION_UNSUPPORTED;
      if (!result) return false;
    }
    return true;
  }

  for (const [conditionKey, conditionValue] of entries) {
    const result = evaluateWorkItemFilterCondition(conditionKey, conditionValue, issue, stateMap);
    if (result === FILTER_EVALUATION_UNSUPPORTED) return FILTER_EVALUATION_UNSUPPORTED;
    if (!result) return false;
  }

  return true;
};

const evaluateWorkItemFilters = (
  rawFilter: string,
  issue: TIssue,
  stateMap: Record<string, IState> | undefined
): { supported: boolean; matches: boolean } => {
  const trimmedFilter = rawFilter?.trim();
  if (!trimmedFilter || trimmedFilter === "{}") return { supported: true, matches: true };

  try {
    const parsed = JSON.parse(trimmedFilter);
    const evaluation = evaluateWorkItemFilterNode(parsed, issue, stateMap);
    if (evaluation === FILTER_EVALUATION_UNSUPPORTED) return { supported: false, matches: false };
    return { supported: true, matches: evaluation };
  } catch (error) {
    console.error("Failed to parse project view work item filter expression", error);
    return { supported: false, matches: false };
  }
};

const evaluateProjectViewFilters = (
  issue: TIssue,
  filters: AppliedProjectViewFilters,
  stateMap: Record<string, IState> | undefined
): { supported: boolean; matches: boolean } => {
  if (!filters) return { supported: true, matches: true };

  for (const [rawKey, rawValue] of Object.entries(filters)) {
    const key = rawKey as TIssueParams;
    if (rawValue === undefined || rawValue === null) continue;
    if (IGNORED_PROJECT_VIEW_FILTER_KEYS.has(key)) continue;

    if (key === "sub_issue") {
      const shouldIncludeSubIssues = typeof rawValue === "string" ? rawValue === "true" : Boolean(rawValue);
      if (!shouldIncludeSubIssues && issue.parent_id) return { supported: true, matches: false };
      continue;
    }

    if (key === "filters") {
      if (typeof rawValue !== "string") return { supported: false, matches: false };
      const evaluation = evaluateWorkItemFilters(rawValue, issue, stateMap);
      if (!evaluation.supported) return { supported: false, matches: false };
      if (!evaluation.matches) return { supported: true, matches: false };
      continue;
    }

    if (!SUPPORTED_PROJECT_VIEW_FILTER_KEYS.has(key)) return { supported: false, matches: false };

    const filterValues = parseCommaSeparatedValues(rawValue);
    if (filterValues.length === 0) continue;

    const extractor = FIELD_EXTRACTORS[key];
    if (!extractor) return { supported: false, matches: false };

    const issueValues = extractor(issue, stateMap);
    const matches = filterValues.some((value) => issueValues.includes(value));
    if (!matches) return { supported: true, matches: false };
  }

  return { supported: true, matches: true };
};

const issueExistsInGroupedIssueIds = (groupedIssueIds: Record<string, any> | undefined, issueId: string): boolean => {
  if (!groupedIssueIds) return false;

  const checkEntry = (entry: any): boolean => {
    if (!entry) return false;
    if (Array.isArray(entry)) return entry.includes(issueId);
    if (typeof entry === "object") {
      return Object.values(entry).some(checkEntry);
    }
    return false;
  };

  return Object.values(groupedIssueIds).some(checkEntry);
};

const enqueueMicrotask = typeof queueMicrotask === "function"
  ? queueMicrotask
  : (callback: () => void) => {
      Promise.resolve().then(callback);
    };

const buildWsUrl = (workspaceSlug: string, projectId: string, token: string) => {
  const baseUrl = LIVE_BASE_URL?.trim() || window.location.origin;
  const url = new URL(baseUrl);
  const isSecure = url.protocol === "https:" || window.location.protocol === "https:";
  url.protocol = isSecure ? "wss:" : "ws:";
  url.pathname = `${LIVE_BASE_PATH}/issues`;
  url.searchParams.set("workspaceSlug", workspaceSlug);
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("token", token);
  return url.toString();
};

type TIssueEventPayload = {
  actor_id?: string | null;
  issue_id: string;
  project_id: string;
  timestamp?: number;
  type: string;
  requested_data?: Record<string, any> | string | null;
  current_instance?: Record<string, any> | string | null;
};

type IssueSyncState = {
  latestPayload: TIssueEventPayload | null;
  pendingGroupedListUpdate: boolean;
  isProcessing: boolean;
};

class IssueSyncQueue {
  private readonly state = new Map<string, IssueSyncState>();
  private disposed = false;

  constructor(private readonly workspaceSlug: string, private readonly projectId: string) {}

  enqueue(payload: TIssueEventPayload) {
    if (this.disposed) return;

    const issueIdRaw = payload?.issue_id;
    if (!issueIdRaw) return;

    const issueId = String(issueIdRaw);
    const existingState = this.state.get(issueId) ?? {
      latestPayload: null,
      pendingGroupedListUpdate: false,
      isProcessing: false,
    };

    existingState.latestPayload = payload;
    existingState.pendingGroupedListUpdate =
      existingState.pendingGroupedListUpdate || this.requiresGroupedListUpdate(payload.type);
    this.state.set(issueId, existingState);

    if (!existingState.isProcessing) {
      existingState.isProcessing = true;
      this.state.set(issueId, existingState);
      enqueueMicrotask(() => this.processIssue(issueId));
    }
  }

  dispose() {
    this.disposed = true;
    this.state.clear();
  }

  private requiresGroupedListUpdate(type?: string) {
    return Boolean(type && GROUPED_LIST_EVENT_PATTERN.test(type));
  }

  private async processIssue(issueId: string) {
    const state = this.state.get(issueId);
    if (!state || this.disposed) {
      this.state.delete(issueId);
      return;
    }

    while (!this.disposed) {
      const { latestPayload, pendingGroupedListUpdate } = state;

      if (!latestPayload && !pendingGroupedListUpdate) {
        break;
      }

      state.latestPayload = null;
      state.pendingGroupedListUpdate = false;

      await this.syncIssue(issueId, pendingGroupedListUpdate);

      if (this.disposed) {
        return;
      }
    }

    state.isProcessing = false;

    if (!state.latestPayload && !state.pendingGroupedListUpdate) {
      this.state.delete(issueId);
    } else if (!this.disposed) {
      state.isProcessing = true;
      enqueueMicrotask(() => this.processIssue(issueId));
    }
  }

  private async syncIssue(issueId: string, shouldUpdateGroupedLists: boolean) {
    const stores = {
      projectIssues: rootStore.issue.projectIssues,
      moduleIssues: rootStore.issue.moduleIssues,
      issues: rootStore.issue.issues,
      projectViewIssues: rootStore.issue.projectViewIssues,
    };

    const existingIssue = stores.issues.getIssueById(issueId);
    const existingIssueSnapshot = existingIssue ? cloneDeep(existingIssue) : undefined;

    const context = {
      activeModuleId: rootStore.issue.moduleId || null,
      activeProjectViewId: rootStore.issue.viewId || null,
      stateMap: rootStore.issue.stateMap,
      existingIssue,
      existingIssueSnapshot,
    };

    const shouldAttemptProjectViewUpdate =
      shouldUpdateGroupedLists && Boolean(stores.projectViewIssues && context.activeProjectViewId);
    const wasInActiveProjectView = shouldAttemptProjectViewUpdate
      ? issueExistsInGroupedIssueIds(stores.projectViewIssues?.groupedIssueIds, issueId)
      : false;

    try {
      const fetchedIssues = await stores.issues.getIssues(this.workspaceSlug, this.projectId, [issueId]);
      const issue = fetchedIssues?.[0];

      if (!issue) {
        this.handleIssueNotFound({
          stores,
          issueId,
          shouldAttemptProjectViewUpdate,
          wasInActiveProjectView,
        });
        return;
      }

      if (this.disposed) return;

      this.updateIssueInStores({
        stores,
        context,
        issue,
        shouldUpdateGroupedLists,
        shouldAttemptProjectViewUpdate,
        wasInActiveProjectView,
      });
    } catch (error: any) {
      this.handleSyncError({
        error,
        stores,
        issueId,
        shouldAttemptProjectViewUpdate,
        wasInActiveProjectView,
      });
    }
  }

  private handleIssueNotFound({
    stores,
    issueId,
    shouldAttemptProjectViewUpdate,
    wasInActiveProjectView,
  }: {
    stores: {
      projectIssues: any;
      moduleIssues: any;
      issues: any;
      projectViewIssues: any;
    };
    issueId: string;
    shouldAttemptProjectViewUpdate: boolean;
    wasInActiveProjectView: boolean;
  }) {
    stores.projectIssues?.removeIssueFromList(issueId);
    stores.moduleIssues?.removeIssueFromList(issueId);
    if (shouldAttemptProjectViewUpdate && wasInActiveProjectView) {
      stores.projectViewIssues?.removeIssueFromList(issueId);
    }
    stores.issues.removeIssue(issueId);
  }

  private updateIssueInStores({
    stores,
    context,
    issue,
    shouldUpdateGroupedLists,
    shouldAttemptProjectViewUpdate,
    wasInActiveProjectView,
  }: {
    stores: {
      projectIssues: any;
      moduleIssues: any;
      issues: any;
      projectViewIssues: any;
    };
    context: {
      activeModuleId: string | null;
      activeProjectViewId: string | null;
      stateMap: Record<string, any> | undefined;
      existingIssueSnapshot: TIssue | undefined;
    };
    issue: any;
    shouldUpdateGroupedLists: boolean;
    shouldAttemptProjectViewUpdate: boolean;
    wasInActiveProjectView: boolean;
  }) {
    stores.issues.addIssue([issue]);

    if (shouldUpdateGroupedLists) {
      stores.projectIssues?.updateIssueList(issue, context.existingIssueSnapshot);
    }

    if (context.activeModuleId) {
      const previousModuleIdsRaw = context.existingIssueSnapshot?.module_ids;
      const previousModuleIds = Array.isArray(previousModuleIdsRaw) ? previousModuleIdsRaw : [];
      const currentModuleIds = Array.isArray(issue.module_ids) ? issue.module_ids : [];

      const wasInActiveModule = previousModuleIds.includes(context.activeModuleId);
      const isInActiveModuleNow = currentModuleIds.includes(context.activeModuleId);

      if (isInActiveModuleNow && !wasInActiveModule) {
        stores.moduleIssues?.addIssueToList(issue.id);
      } else if (!isInActiveModuleNow && wasInActiveModule) {
        stores.moduleIssues?.removeIssueFromList(issue.id, context.existingIssueSnapshot);
      } else if (isInActiveModuleNow) {
        stores.moduleIssues?.updateIssueList(issue, context.existingIssueSnapshot);
      }
    }

    if (shouldAttemptProjectViewUpdate) {
      this.handleProjectViewUpdate({
        stores,
        context,
        issue,
        wasInActiveProjectView,
      });
    }
  }

  private handleProjectViewUpdate({
    stores,
    context,
    issue,
    wasInActiveProjectView,
  }: {
    stores: {
      projectViewIssues: any;
    };
    context: {
      activeProjectViewId: string | null;
      stateMap: Record<string, any> | undefined;
      existingIssueSnapshot: TIssue | undefined;
    };
    issue: any;
    wasInActiveProjectView: boolean;
  }) {
    const evaluation = evaluateProjectViewFilters(
      issue,
      stores.projectViewIssues?.issueFilterStore?.appliedFilters,
      context.stateMap
    );

    if (!evaluation.supported) {
      stores.projectViewIssues
        ?.fetchIssuesWithExistingPagination?.(
          this.workspaceSlug,
          this.projectId,
          context.activeProjectViewId as string,
          "mutation"
        )
        ?.catch((error: unknown) => {
          console.error("Failed to refresh project view issues after realtime update", error);
        });
      return;
    }

    if (evaluation.matches) {
      stores.projectViewIssues?.updateIssueList(issue, context.existingIssueSnapshot);
      return;
    }

    if (wasInActiveProjectView) {
      if (context.existingIssueSnapshot) {
        stores.projectViewIssues?.updateIssueList(
          undefined,
          context.existingIssueSnapshot,
          EIssueGroupedAction.DELETE
        );
      } else {
        stores.projectViewIssues?.removeIssueFromList(issue.id);
      }
    }
  }

  private handleSyncError({
    error,
    stores,
    issueId,
    shouldAttemptProjectViewUpdate,
    wasInActiveProjectView,
  }: {
    error: any;
    stores: {
      projectIssues: any;
      moduleIssues: any;
      issues: any;
      projectViewIssues: any;
    };
    issueId: string;
    shouldAttemptProjectViewUpdate: boolean;
    wasInActiveProjectView: boolean;
  }) {
    if (this.disposed) return;

    const status = error?.response?.status ?? error?.status;
    if (status === 404) {
      this.handleIssueNotFound({
        stores,
        issueId,
        shouldAttemptProjectViewUpdate,
        wasInActiveProjectView,
      });
    } else {
      console.error("Failed to process realtime issue event", error);
    }
  }
}

type IssueRealtimeConnectionOptions = {
  workspaceSlug: string;
  projectId: string;
  userId: string;
  onPayload: (payload: TIssueEventPayload) => void;
};

class IssueRealtimeConnection {
  private websocket: WebSocket | null = null;
  private reconnectAttempt = 0;
  private reconnectTimeoutId: number | null = null;
  private disposed = false;

  constructor(private readonly options: IssueRealtimeConnectionOptions) {}

  start() {
    this.connect();
  }

  dispose() {
    this.disposed = true;
    this.clearReconnectTimer();
    this.closeSocket();
  }

  private connect() {
    if (this.disposed) return;

    this.clearReconnectTimer();
    this.closeSocket();

    const token = JSON.stringify({ id: this.options.userId, cookie: document.cookie });
    const wsUrl = buildWsUrl(this.options.workspaceSlug, this.options.projectId, token);
    const socket = new WebSocket(wsUrl);
    this.websocket = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
    };

    socket.onmessage = (event: MessageEvent) => {
      const rawData = typeof event.data === "string" ? event.data : undefined;
      if (!rawData) return;

      try {
        const payload = JSON.parse(rawData) as TIssueEventPayload;
        if (payload && String(payload.project_id) === this.options.projectId) {
          this.options.onPayload(payload);
        }
      } catch (error) {
        console.error("Failed to parse issue event payload", error);
      }
    };

    socket.onerror = () => {
      try {
        socket.close();
      } catch {
        // no-op
      }
    };

    socket.onclose = () => {
      if (this.disposed) {
        return;
      }

      this.websocket = null;
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.disposed) return;

    const attempt = this.reconnectAttempt + 1;
    this.reconnectAttempt = attempt;
    const delay = Math.min(
      MAX_RECONNECT_INTERVAL,
      INITIAL_RECONNECT_INTERVAL * Math.pow(2, attempt - 1)
    );

    this.clearReconnectTimer();
    this.reconnectTimeoutId = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimeoutId !== null) {
      window.clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  private closeSocket() {
    if (!this.websocket) return;

    const socket = this.websocket;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;

    try {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    } catch {
      // no-op
    }

    this.websocket = null;
  }
}

export const useIssueChannel = (workspaceSlug?: string, projectId?: string) => {
  const { data: currentUser } = useUser();

  useEffect(() => {
    if (!workspaceSlug || !projectId || !currentUser?.id) return;

    const resolvedWorkspaceSlug = String(workspaceSlug);
    const resolvedProjectId = String(projectId);

    const queue = new IssueSyncQueue(resolvedWorkspaceSlug, resolvedProjectId);
    const connection = new IssueRealtimeConnection({
      workspaceSlug: resolvedWorkspaceSlug,
      projectId: resolvedProjectId,
      userId: currentUser.id,
      onPayload: (payload) => queue.enqueue(payload),
    });

    connection.start();

    return () => {
      connection.dispose();
      queue.dispose();
    };
  }, [workspaceSlug, projectId, currentUser?.id]);
};
