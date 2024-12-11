import { difference } from "lodash";
import { IEstimate, IEstimatePoint, IWorkspaceMember, TIssue } from "@plane/types";
import { API_BASE_URL } from "@/helpers/common.helper";
import { EstimateService } from "@/plane-web/services/project/estimate.service";
import { CycleService } from "@/services/cycle.service";
import { IssueLabelService } from "@/services/issue/issue_label.service";
import { ModuleService } from "@/services/module.service";
import { ProjectStateService } from "@/services/project";
import { WorkspaceService } from "@/services/workspace.service";
import { persistence } from "../storage.sqlite";
import { updateIssue } from "./load-issues";
import {
  cycleSchema,
  estimatePointSchema,
  labelSchema,
  memberSchema,
  moduleSchema,
  Schema,
  stateSchema,
} from "./schemas";
import { log } from "./utils";

const stageInserts = async (table: string, schema: Schema, data: any) => {
  const keys = Object.keys(schema);
  // Pick only the keys that are in the schema
  const filteredData = keys.reduce((acc: any, key) => {
    if (data[key] || data[key] === 0) {
      acc[key] = data[key];
    }
    return acc;
  }, {});
  const columns = "'" + Object.keys(filteredData).join("','") + "'";
  // Add quotes to column names

  const values = Object.values(filteredData)
    .map((value) => {
      if (value === null) {
        return "";
      }
      if (typeof value === "object") {
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      }
      if (typeof value === "string") {
        return `'${value.replace(/'/g, "''")}'`;
      }
      return value;
    })
    .join(", ");
  const query = `INSERT OR REPLACE INTO ${table} (${columns}) VALUES (${values});`;
  await persistence.db.exec(query);
};

const batchInserts = async (data: any[], table: string, schema: Schema, batchSize = 500) => {
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    for (let j = 0; j < batch.length; j++) {
      const item = batch[j];
      await stageInserts(table, schema, item);
    }
  }
};

export const getLabels = async (workspaceSlug: string) => {
  const issueLabelService = new IssueLabelService();
  const objects = await issueLabelService.getWorkspaceIssueLabels(workspaceSlug);

  return objects;
};

export const getModules = async (workspaceSlug: string) => {
  const moduleService = new ModuleService();
  const objects = await moduleService.getWorkspaceModules(workspaceSlug);
  return objects;
};

export const getCycles = async (workspaceSlug: string) => {
  const cycleService = new CycleService();

  const objects = await cycleService.getWorkspaceCycles(workspaceSlug);
  return objects;
};

export const getStates = async (workspaceSlug: string) => {
  const stateService = new ProjectStateService();
  const objects = await stateService.getWorkspaceStates(workspaceSlug);
  return objects;
};

export const getEstimatePoints = async (workspaceSlug: string) => {
  const estimateService = new EstimateService();
  const estimates = await estimateService.fetchWorkspaceEstimates(workspaceSlug);
  let objects: IEstimatePoint[] = [];
  (estimates || []).forEach((estimate: IEstimate) => {
    if (estimate?.points) {
      objects = objects.concat(estimate.points);
    }
  });
  return objects;
};

export const getMembers = async (workspaceSlug: string) => {
  const workspaceService = new WorkspaceService(API_BASE_URL);
  const members = await workspaceService.fetchWorkspaceMembers(workspaceSlug);
  const objects = members.map((member: IWorkspaceMember) => member.member);
  return objects;
};

const syncLabels = async (currentLabels: any) => {
  const currentIdList = currentLabels.map((label: any) => label.id);
  const existingLabels = await persistence.db.exec("SELECT id FROM labels;");

  const existingIdList = existingLabels.map((label: any) => label.id);

  const deletedIds = difference(existingIdList, currentIdList);

  await syncIssuesWithDeletedLabels(deletedIds as string[]);
};

export const syncIssuesWithDeletedLabels = async (deletedLabelIds: string[]) => {
  if (!deletedLabelIds.length) {
    return;
  }

  // Ideally we should use recursion to fetch all the issues, but 10000 issues is more than enough for now.
  const issues = await persistence.getIssues("", "", { labels: deletedLabelIds.join(","), cursor: "10000:0:0" }, {});
  if (issues?.results && Array.isArray(issues.results)) {
    const promises = issues.results.map(async (issue: TIssue) => {
      const updatedIssue = {
        ...issue,
        label_ids: issue.label_ids.filter((id: string) => !deletedLabelIds.includes(id)),
        is_local_update: 1,
      };
      // We should await each update because it uses a transaction. But transaction are handled in the query executor.
      updateIssue(updatedIssue);
    });
    await Promise.all(promises);
  }
};

const syncModules = async (currentModules: any) => {
  const currentIdList = currentModules.map((module: any) => module.id);
  const existingModules = await persistence.db.exec("SELECT id FROM modules;");
  const existingIdList = existingModules.map((module: any) => module.id);
  const deletedIds = difference(existingIdList, currentIdList);
  await syncIssuesWithDeletedModules(deletedIds as string[]);
};

export const syncIssuesWithDeletedModules = async (deletedModuleIds: string[]) => {
  if (!deletedModuleIds.length) {
    return;
  }

  const issues = await persistence.getIssues("", "", { module: deletedModuleIds.join(","), cursor: "10000:0:0" }, {});
  if (issues?.results && Array.isArray(issues.results)) {
    const promises = issues.results.map(async (issue: TIssue) => {
      const updatedIssue = {
        ...issue,
        module_ids: issue.module_ids?.filter((id: string) => !deletedModuleIds.includes(id)) || [],
        is_local_update: 1,
      };
      updateIssue(updatedIssue);
    });
    await Promise.all(promises);
  }
};

const syncCycles = async (currentCycles: any) => {
  const currentIdList = currentCycles.map((cycle: any) => cycle.id);
  const existingCycles = await persistence.db.exec("SELECT id FROM cycles;");
  const existingIdList = existingCycles.map((cycle: any) => cycle.id);
  const deletedIds = difference(existingIdList, currentIdList);
  await syncIssuesWithDeletedCycles(deletedIds as string[]);
};

export const syncIssuesWithDeletedCycles = async (deletedCycleIds: string[]) => {
  if (!deletedCycleIds.length) {
    return;
  }

  const issues = await persistence.getIssues("", "", { cycle: deletedCycleIds.join(","), cursor: "10000:0:0" }, {});
  if (issues?.results && Array.isArray(issues.results)) {
    const promises = issues.results.map(async (issue: TIssue) => {
      const updatedIssue = {
        ...issue,
        cycle_id: null,
        is_local_update: 1,
      };
      updateIssue(updatedIssue);
    });
    await Promise.all(promises);
  }
};

const syncStates = async (currentStates: any) => {
  const currentIdList = currentStates.map((state: any) => state.id);
  const existingStates = await persistence.db.exec("SELECT id FROM states;");
  const existingIdList = existingStates.map((state: any) => state.id);
  const deletedIds = difference(existingIdList, currentIdList);
  await syncIssuesWithDeletedStates(deletedIds as string[]);
};

export const syncIssuesWithDeletedStates = async (deletedStateIds: string[]) => {
  if (!deletedStateIds.length) {
    return;
  }

  const issues = await persistence.getIssues("", "", { state: deletedStateIds.join(","), cursor: "10000:0:0" }, {});
  if (issues?.results && Array.isArray(issues.results)) {
    const promises = issues.results.map(async (issue: TIssue) => {
      const updatedIssue = {
        ...issue,
        state_id: null,
        is_local_update: 1,
      };
      updateIssue(updatedIssue);
    });
    await Promise.all(promises);
  }
};

const syncMembers = async (currentMembers: any) => {
  const currentIdList = currentMembers.map((member: any) => member.id);
  const existingMembers = await persistence.db.exec("SELECT id FROM members;");
  const existingIdList = existingMembers.map((member: any) => member.id);
  const deletedIds = difference(existingIdList, currentIdList);
  await syncIssuesWithDeletedMembers(deletedIds as string[]);
};

export const syncIssuesWithDeletedMembers = async (deletedMemberIds: string[]) => {
  if (!deletedMemberIds.length) {
    return;
  }

  const issues = await persistence.getIssues(
    "",
    "",
    { assignees: deletedMemberIds.join(","), cursor: "10000:0:0" },
    {}
  );
  if (issues?.results && Array.isArray(issues.results)) {
    const promises = issues.results.map(async (issue: TIssue) => {
      const updatedIssue = {
        ...issue,
        assignee_ids: issue.assignee_ids.filter((id: string) => !deletedMemberIds.includes(id)),
        is_local_update: 1,
      };
      updateIssue(updatedIssue);
    });
    await Promise.all(promises);
  }
};

export const loadWorkSpaceData = async (workspaceSlug: string) => {
  if (!persistence.db || !persistence.db.exec) {
    return;
  }
  log("Loading workspace data");
  const promises = [];
  promises.push(getLabels(workspaceSlug));
  promises.push(getModules(workspaceSlug));
  promises.push(getCycles(workspaceSlug));
  promises.push(getStates(workspaceSlug));
  promises.push(getEstimatePoints(workspaceSlug));
  promises.push(getMembers(workspaceSlug));
  const [labels, modules, cycles, states, estimates, members] = await Promise.all(promises);

  // @todo: we don't need this manual sync here, when backend adds these changes to issue activity and updates the updated_at of the issue.
  await syncLabels(labels);
  await syncModules(modules);
  await syncCycles(cycles);
  await syncStates(states);
  // TODO: Not handling sync estimates yet, as we don't know the new estimate point assigned.
  // Backend should update the updated_at of the issue when estimate point is updated, or we should have realtime sync on the issues table.
  // await syncEstimates(estimates);
  await syncMembers(members);

  const start = performance.now();

  await persistence.db.exec("BEGIN;");
  await persistence.db.exec("DELETE FROM labels WHERE 1=1;");
  await batchInserts(labels, "labels", labelSchema);
  await persistence.db.exec("COMMIT;");

  await persistence.db.exec("BEGIN;");
  await persistence.db.exec("DELETE FROM modules WHERE 1=1;");
  await batchInserts(modules, "modules", moduleSchema);
  await persistence.db.exec("COMMIT;");

  await persistence.db.exec("BEGIN;");
  await persistence.db.exec("DELETE FROM cycles WHERE 1=1;");
  await batchInserts(cycles, "cycles", cycleSchema);
  await persistence.db.exec("COMMIT;");

  await persistence.db.exec("BEGIN;");
  await persistence.db.exec("DELETE FROM states WHERE 1=1;");
  await batchInserts(states, "states", stateSchema);
  await persistence.db.exec("COMMIT;");

  await persistence.db.exec("BEGIN;");
  await persistence.db.exec("DELETE FROM estimate_points WHERE 1=1;");
  await batchInserts(estimates, "estimate_points", estimatePointSchema);
  await persistence.db.exec("COMMIT;");

  await persistence.db.exec("BEGIN;");
  await persistence.db.exec("DELETE FROM members WHERE 1=1;");
  await batchInserts(members, "members", memberSchema);
  await persistence.db.exec("COMMIT;");

  const end = performance.now();
  log("Time taken to load workspace data", end - start);
};
