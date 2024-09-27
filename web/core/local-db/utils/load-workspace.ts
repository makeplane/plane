import { IEstimate, IEstimatePoint, IWorkspaceMember } from "@plane/types";
import { API_BASE_URL } from "@/helpers/common.helper";
import { EstimateService } from "@/plane-web/services/project/estimate.service";
import { CycleService } from "@/services/cycle.service";
import { IssueLabelService } from "@/services/issue/issue_label.service";
import { ModuleService } from "@/services/module.service";
import { ProjectStateService } from "@/services/project";
import { WorkspaceService } from "@/services/workspace.service";
import { persistence } from "../storage.sqlite";
import { cycleSchema, estimatePointSchema, labelSchema, memberSchema, Schema, stateSchema } from "./schemas";

const stageInserts = (table: string, schema: Schema, data: any) => {
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
  persistence.db.exec(query);
};

export const loadLabels = async (workspaceSlug: string, batchSize = 500) => {
  const issueLabelService = new IssueLabelService();
  const objects = await issueLabelService.getWorkspaceIssueLabels(workspaceSlug);
  for (let i = 0; i < objects.length; i += batchSize) {
    const batch = objects.slice(i, i + batchSize);

    persistence.db.exec("BEGIN TRANSACTION;");
    batch.forEach((label: any) => {
      stageInserts("labels", labelSchema, label);
    });
    await persistence.db.exec("COMMIT;");
  }
};

export const loadModules = async (workspaceSlug: string, batchSize = 500) => {
  const moduleService = new ModuleService();
  const objects = await moduleService.getWorkspaceModules(workspaceSlug);
  for (let i = 0; i < objects.length; i += batchSize) {
    const batch = objects.slice(i, i + batchSize);

    persistence.db.exec("BEGIN TRANSACTION;");
    batch.forEach((label: any) => {
      stageInserts("modules", labelSchema, label);
    });
    await persistence.db.exec("COMMIT;");
  }
};

export const loadCycles = async (workspaceSlug: string, batchSize = 500) => {
  const cycleService = new CycleService();

  const objects = await cycleService.getWorkspaceCycles(workspaceSlug);
  for (let i = 0; i < objects.length; i += batchSize) {
    const batch = objects.slice(i, i + batchSize);

    persistence.db.exec("BEGIN TRANSACTION;");
    batch.forEach((cycle: any) => {
      stageInserts("cycles", cycleSchema, cycle);
    });
    await persistence.db.exec("COMMIT;");
  }
};

export const loadStates = async (workspaceSlug: string, batchSize = 500) => {
  const stateService = new ProjectStateService();
  const objects = await stateService.getWorkspaceStates(workspaceSlug);
  for (let i = 0; i < objects.length; i += batchSize) {
    const batch = objects.slice(i, i + batchSize);

    persistence.db.exec("BEGIN TRANSACTION;");
    batch.forEach((state: any) => {
      stageInserts("states", stateSchema, state);
    });
    await persistence.db.exec("COMMIT;");
  }
};

export const loadEstimatePoints = async (workspaceSlug: string, batchSize = 500) => {
  const estimateService = new EstimateService();
  const estimates = await estimateService.fetchWorkspaceEstimates(workspaceSlug);
  const objects: IEstimatePoint[] = [];
  (estimates || []).forEach((estimate: IEstimate) => {
    if (estimate?.points) {
      objects.concat(estimate.points);
    }
  });
  for (let i = 0; i < objects.length; i += batchSize) {
    const batch = objects.slice(i, i + batchSize);

    persistence.db.exec("BEGIN TRANSACTION;");
    batch.forEach((point: any) => {
      stageInserts("estimate_points", estimatePointSchema, point);
    });
    await persistence.db.exec("COMMIT;");
  }
};

export const loadMembers = async (workspaceSlug: string, batchSize = 500) => {
  const workspaceService = new WorkspaceService(API_BASE_URL);
  const members = await workspaceService.fetchWorkspaceMembers(workspaceSlug);
  const objects = members.map((member: IWorkspaceMember) => member.member);
  for (let i = 0; i < objects.length; i += batchSize) {
    const batch = objects.slice(i, i + batchSize);
    persistence.db.exec("BEGIN TRANSACTION;");
    batch.forEach((member: any) => {
      stageInserts("members", memberSchema, member);
    });
    await persistence.db.exec("COMMIT;");
  }
};

export const loadWorkSpaceData = async (workspaceSlug: string) => {
  const promises = [];
  promises.push(loadLabels(workspaceSlug));
  promises.push(loadModules(workspaceSlug));
  promises.push(loadCycles(workspaceSlug));
  promises.push(loadStates(workspaceSlug));
  promises.push(loadEstimatePoints(workspaceSlug));
  promises.push(loadMembers(workspaceSlug));
  await Promise.all(promises);
};
