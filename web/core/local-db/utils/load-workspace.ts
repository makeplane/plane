import { IEstimate, IEstimatePoint, IWorkspaceMember } from "@plane/types";
import { API_BASE_URL } from "@/helpers/common.helper";
import { EstimateService } from "@/plane-web/services/project/estimate.service";
import { CycleService } from "@/services/cycle.service";
import { IssueLabelService } from "@/services/issue/issue_label.service";
import { ModuleService } from "@/services/module.service";
import { ProjectStateService } from "@/services/project";
import { WorkspaceService } from "@/services/workspace.service";
import { persistence } from "../storage.sqlite";
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
  const objects: IEstimatePoint[] = [];
  (estimates || []).forEach((estimate: IEstimate) => {
    if (estimate?.points) {
      objects.concat(estimate.points);
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

export const loadWorkSpaceData = async (workspaceSlug: string) => {
  log("Loading workspace data");
  const promises = [];
  promises.push(getLabels(workspaceSlug));
  promises.push(getModules(workspaceSlug));
  promises.push(getCycles(workspaceSlug));
  promises.push(getStates(workspaceSlug));
  promises.push(getEstimatePoints(workspaceSlug));
  promises.push(getMembers(workspaceSlug));
  const [labels, modules, cycles, states, estimates, memebers] = await Promise.all(promises);

  const start = performance.now();
  await persistence.db.exec("BEGIN TRANSACTION;");
  await batchInserts(labels, "labels", labelSchema);
  await batchInserts(modules, "modules", moduleSchema);
  await batchInserts(cycles, "cycles", cycleSchema);
  await batchInserts(states, "states", stateSchema);
  await batchInserts(estimates, "estimate_points", estimatePointSchema);
  await batchInserts(memebers, "members", memberSchema);
  await persistence.db.exec("COMMIT");
  const end = performance.now();
  log("Time taken to load workspace data", end - start);
};
