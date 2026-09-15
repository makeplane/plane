/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import type {
  TApprovalFlow,
  TApprovalRequest,
  TMentorBinding,
  TOrgUnit,
  TOrgUnitMember,
  TPeriodicReport,
  TReportAttachment,
  TReportReviewLog,
  TReportSummary,
  TReportTemplate,
  TResearchAuditEvent,
  TResearchIdentity,
  TStageGate,
  TStageGatePhase,
  TStageInstance,
  TStageMaterial,
  TStageMaterialVersion,
  TStageRequirement,
  TStageTransition,
  TWorkspaceResearchSetting,
} from "@plane/types";
// services
import { ResearchApprovalService } from "@/services/research/approval.service";
import { ResearchOrgService } from "@/services/research/org.service";
import type { TOrgUnitPayload } from "@/services/research/org.service";
import { ResearchPlatformService } from "@/services/research/platform.service";
import { ResearchProjectService } from "@/services/research/project.service";
import type { TResearchProject, TResearchProjectCreatePayload } from "@/services/research/project.service";
import { ResearchReportService } from "@/services/research/report.service";
import type { TReportCreatePayload, TReportListParams } from "@/services/research/report.service";
import { ResearchStageService } from "@/services/research/stage.service";
import type {
  TStageMaterialCreatePayload,
  TStageMaterialUpdatePayload,
  TStageRequirementUpdate,
} from "@/services/research/stage.service";
// root store
import type { CoreRootStore } from "../root.store";

export interface IResearchStore {
  // loaders
  identityLoader: boolean;
  orgLoader: boolean;
  reportLoader: boolean;
  projectLoader: boolean;
  approvalLoader: boolean;
  templatesLoader: boolean;
  auditLoader: boolean;
  stageLoader: boolean;
  // observables
  identity: TResearchIdentity | null;
  identityErrorCode: string | null;
  orgUnits: Record<string, TOrgUnit>;
  orgUnitIdsByWorkspace: Record<string, string[]>;
  orgUnitMembers: Record<string, TOrgUnitMember[]>;
  mentorBindings: Record<string, TMentorBinding>;
  mentorBindingIdsByWorkspace: Record<string, string[]>;
  reports: Record<string, TPeriodicReport>;
  reportIdsByWorkspace: Record<string, string[]>;
  reportHistory: Record<string, TReportReviewLog[]>;
  reportAttachments: Record<string, TReportAttachment[]>;
  reportSummary: Record<string, TReportSummary>;
  summaryByWorkspace: Record<string, TReportSummary>;
  reportTemplates: Record<string, TReportTemplate>;
  reportTemplateIdsByWorkspace: Record<string, string[]>;
  researchProjects: Record<string, TResearchProject>;
  researchProjectIdsByWorkspace: Record<string, string[]>;
  approvalFlows: Record<string, TApprovalFlow>;
  approvalFlowIdsByWorkspace: Record<string, string[]>;
  approvalRequests: Record<string, TApprovalRequest>;
  approvalRequestIdsByWorkspace: Record<string, string[]>;
  auditEvents: Record<string, TResearchAuditEvent>;
  auditEventIdsByWorkspace: Record<string, string[]>;
  stages: Record<string, TStageInstance>;
  stageIdsByProject: Record<string, string[]>;
  stageGate: Record<string, TStageGate>;
  stageTransitions: Record<string, TStageTransition[]>;
  stageMaterials: Record<string, TStageMaterial>;
  materialIdsByStage: Record<string, string[]>;
  materialVersions: Record<string, TStageMaterialVersion[]>;
  stageRequirements: Record<string, TStageRequirement[]>;
  // computed
  isEnabled: boolean;
  isWorkspaceAdmin: boolean;
  isOrgSectionEnabled: boolean;
  isReportSectionEnabled: boolean;
  isApprovalSectionEnabled: boolean;
  isStageSectionEnabled: boolean;
  // lookup helpers (plain methods: reads are tracked in the caller's reactive context)
  getOrgUnits: (workspaceSlug: string) => TOrgUnit[];
  getReports: (workspaceSlug: string) => TPeriodicReport[];
  getResearchProjects: (workspaceSlug: string) => TResearchProject[];
  getApprovalRequests: (workspaceSlug: string) => TApprovalRequest[];
  getApprovalFlows: (workspaceSlug: string) => TApprovalFlow[];
  getReportTemplates: (workspaceSlug: string) => TReportTemplate[];
  getAuditEvents: (workspaceSlug: string) => TResearchAuditEvent[];
  getProjectStages: (workspaceSlug: string, projectId: string) => TStageInstance[];
  getStageMaterials: (stageId: string) => TStageMaterial[];
  // actions
  fetchIdentity: (workspaceSlug: string) => Promise<TResearchIdentity>;
  fetchOrgUnits: (workspaceSlug: string, options?: { includeInactive?: boolean }) => Promise<TOrgUnit[]>;
  createOrgUnit: (workspaceSlug: string, payload: TOrgUnitPayload) => Promise<TOrgUnit>;
  updateOrgUnit: (workspaceSlug: string, unitId: string, payload: TOrgUnitPayload) => Promise<TOrgUnit>;
  deleteOrgUnit: (workspaceSlug: string, unitId: string) => Promise<void>;
  fetchOrgUnitMembers: (workspaceSlug: string, unitId: string) => Promise<TOrgUnitMember[]>;
  addOrgUnitMember: (
    workspaceSlug: string,
    unitId: string,
    payload: { user: string; org_role: string; is_primary?: boolean; effective_to?: string | null }
  ) => Promise<void>;
  updateOrgUnitMember: (
    workspaceSlug: string,
    unitId: string,
    memberId: string,
    payload: Partial<TOrgUnitMember>
  ) => Promise<void>;
  removeOrgUnitMember: (workspaceSlug: string, unitId: string, memberId: string) => Promise<void>;
  transferPi: (workspaceSlug: string, unitId: string, userIds: string[]) => Promise<void>;
  fetchMentorBindings: (
    workspaceSlug: string,
    params?: { mentee?: string; mentor?: string; org_unit?: string }
  ) => Promise<TMentorBinding[]>;
  createMentorBinding: (
    workspaceSlug: string,
    payload: { mentee: string; mentor: string; org_unit?: string | null }
  ) => Promise<void>;
  deleteMentorBinding: (workspaceSlug: string, bindingId: string) => Promise<void>;
  fetchReports: (workspaceSlug: string, params?: TReportListParams) => Promise<TPeriodicReport[]>;
  createReport: (workspaceSlug: string, payload: TReportCreatePayload) => Promise<TPeriodicReport>;
  fetchReport: (workspaceSlug: string, reportId: string) => Promise<TPeriodicReport>;
  submitReport: (workspaceSlug: string, reportId: string) => Promise<TPeriodicReport>;
  returnReport: (workspaceSlug: string, reportId: string, comment: string) => Promise<TPeriodicReport>;
  acceptReport: (workspaceSlug: string, reportId: string) => Promise<TPeriodicReport>;
  fetchReportHistory: (workspaceSlug: string, reportId: string) => Promise<TReportReviewLog[]>;
  fetchReportAttachments: (workspaceSlug: string, reportId: string) => Promise<TReportAttachment[]>;
  uploadReportAttachment: (
    workspaceSlug: string,
    reportId: string,
    file: { file_name: string; content_type: string; size: number; body: Blob }
  ) => Promise<void>;
  deleteReportAttachment: (workspaceSlug: string, reportId: string, attachmentId: string) => Promise<void>;
  importReportMarkdown: (
    workspaceSlug: string,
    reportId: string,
    payload: { content: string; file_name?: string }
  ) => Promise<string[]>;
  updateReportVisibility: (
    workspaceSlug: string,
    reportId: string,
    visibility: string,
    grants?: { grantee_user?: string; grantee_org_unit?: string }[]
  ) => Promise<void>;
  fetchReportSummary: (
    workspaceSlug: string,
    params?: { period_key?: string; report_type?: string; org_unit?: string }
  ) => Promise<TReportSummary>;
  fetchReportTemplates: (workspaceSlug: string) => Promise<TReportTemplate[]>;
  createReportTemplate: (
    workspaceSlug: string,
    payload: { name: string; report_type: string; is_default?: boolean }
  ) => Promise<TReportTemplate>;
  updateReportTemplate: (
    workspaceSlug: string,
    templateId: string,
    payload: Partial<TReportTemplate>
  ) => Promise<TReportTemplate>;
  deleteReportTemplate: (workspaceSlug: string, templateId: string) => Promise<void>;
  fetchResearchProjects: (workspaceSlug: string, params?: Record<string, string>) => Promise<TResearchProject[]>;
  createResearchProject: (workspaceSlug: string, payload: TResearchProjectCreatePayload) => Promise<TResearchProject>;
  archiveResearchProject: (workspaceSlug: string, projectId: string) => Promise<void>;
  restoreResearchProject: (workspaceSlug: string, projectId: string) => Promise<void>;
  fetchApprovalFlows: (workspaceSlug: string) => Promise<TApprovalFlow[]>;
  createApprovalFlow: (
    workspaceSlug: string,
    payload: Parameters<ResearchApprovalService["createApprovalFlow"]>[1]
  ) => Promise<TApprovalFlow>;
  fetchApprovalRequests: (workspaceSlug: string, scope?: string) => Promise<TApprovalRequest[]>;
  createApprovalRequest: (
    workspaceSlug: string,
    payload: Parameters<ResearchApprovalService["createApprovalRequest"]>[1]
  ) => Promise<TApprovalRequest>;
  approveApprovalRequest: (workspaceSlug: string, requestId: string, comment?: string) => Promise<TApprovalRequest>;
  rejectApprovalRequest: (workspaceSlug: string, requestId: string, comment: string) => Promise<TApprovalRequest>;
  withdrawApprovalRequest: (workspaceSlug: string, requestId: string) => Promise<TApprovalRequest>;
  fetchAuditEvents: (workspaceSlug: string, params?: Record<string, string>) => Promise<TResearchAuditEvent[]>;
  fetchSettings: (workspaceSlug: string) => Promise<TWorkspaceResearchSetting | null>;
  updateSettings: (
    workspaceSlug: string,
    payload: Partial<TWorkspaceResearchSetting>
  ) => Promise<TWorkspaceResearchSetting | null>;
  // stage workflow (P1-A1)
  fetchProjectStages: (workspaceSlug: string, projectId: string) => Promise<TStageInstance[]>;
  createProjectStages: (workspaceSlug: string, projectId: string) => Promise<TStageInstance[]>;
  fetchStage: (workspaceSlug: string, stageId: string) => Promise<TStageInstance>;
  fetchStageGate: (workspaceSlug: string, stageId: string, phase?: TStageGatePhase) => Promise<TStageGate>;
  fetchStageTransitions: (workspaceSlug: string, stageId: string) => Promise<TStageTransition[]>;
  enterStage: (workspaceSlug: string, stageId: string) => Promise<TStageInstance>;
  submitStage: (workspaceSlug: string, stageId: string) => Promise<TStageInstance>;
  returnStage: (workspaceSlug: string, stageId: string, reason: string) => Promise<TStageInstance>;
  passStage: (workspaceSlug: string, stageId: string) => Promise<TStageInstance>;
  reopenStage: (workspaceSlug: string, stageId: string, reason: string, confirm?: boolean) => Promise<TStageInstance>;
  fetchStageMaterials: (workspaceSlug: string, stageId: string) => Promise<TStageMaterial[]>;
  createStageMaterial: (
    workspaceSlug: string,
    stageId: string,
    payload: TStageMaterialCreatePayload
  ) => Promise<TStageMaterial>;
  fetchStageMaterial: (workspaceSlug: string, materialId: string) => Promise<TStageMaterial>;
  updateStageMaterial: (
    workspaceSlug: string,
    materialId: string,
    payload: TStageMaterialUpdatePayload
  ) => Promise<TStageMaterial>;
  submitStageMaterial: (workspaceSlug: string, materialId: string) => Promise<TStageMaterial>;
  fetchMaterialVersions: (workspaceSlug: string, materialId: string) => Promise<TStageMaterialVersion[]>;
  fetchStageRequirements: (workspaceSlug: string, stage?: string) => Promise<TStageRequirement[]>;
  updateStageRequirements: (workspaceSlug: string, items: TStageRequirementUpdate[]) => Promise<void>;
}

export class ResearchStore implements IResearchStore {
  identityLoader = false;
  orgLoader = false;
  reportLoader = false;
  projectLoader = false;
  approvalLoader = false;
  templatesLoader = false;
  auditLoader = false;
  stageLoader = false;

  identity: TResearchIdentity | null = null;
  identityErrorCode: string | null = null;
  orgUnits: Record<string, TOrgUnit> = {};
  orgUnitIdsByWorkspace: Record<string, string[]> = {};
  orgUnitMembers: Record<string, TOrgUnitMember[]> = {};
  mentorBindings: Record<string, TMentorBinding> = {};
  mentorBindingIdsByWorkspace: Record<string, string[]> = {};
  reports: Record<string, TPeriodicReport> = {};
  reportIdsByWorkspace: Record<string, string[]> = {};
  reportHistory: Record<string, TReportReviewLog[]> = {};
  reportAttachments: Record<string, TReportAttachment[]> = {};
  reportSummary: Record<string, TReportSummary> = {};
  summaryByWorkspace: Record<string, TReportSummary> = {};
  reportTemplates: Record<string, TReportTemplate> = {};
  reportTemplateIdsByWorkspace: Record<string, string[]> = {};
  researchProjects: Record<string, TResearchProject> = {};
  researchProjectIdsByWorkspace: Record<string, string[]> = {};
  approvalFlows: Record<string, TApprovalFlow> = {};
  approvalFlowIdsByWorkspace: Record<string, string[]> = {};
  approvalRequests: Record<string, TApprovalRequest> = {};
  approvalRequestIdsByWorkspace: Record<string, string[]> = {};
  auditEvents: Record<string, TResearchAuditEvent> = {};
  auditEventIdsByWorkspace: Record<string, string[]> = {};
  settings: Record<string, TWorkspaceResearchSetting> = {};
  stages: Record<string, TStageInstance> = {};
  stageIdsByProject: Record<string, string[]> = {};
  stageGate: Record<string, TStageGate> = {};
  stageTransitions: Record<string, TStageTransition[]> = {};
  stageMaterials: Record<string, TStageMaterial> = {};
  materialIdsByStage: Record<string, string[]> = {};
  materialVersions: Record<string, TStageMaterialVersion[]> = {};
  stageRequirements: Record<string, TStageRequirement[]> = {};

  private orgService: ResearchOrgService;
  private reportService: ResearchReportService;
  private projectService: ResearchProjectService;
  private approvalService: ResearchApprovalService;
  private platformService: ResearchPlatformService;
  private stageService: ResearchStageService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // loaders
      identityLoader: observable,
      orgLoader: observable,
      reportLoader: observable,
      projectLoader: observable,
      approvalLoader: observable,
      templatesLoader: observable,
      auditLoader: observable,
      stageLoader: observable,
      // observables
      identity: observable,
      identityErrorCode: observable,
      orgUnits: observable,
      orgUnitIdsByWorkspace: observable,
      orgUnitMembers: observable,
      mentorBindings: observable,
      mentorBindingIdsByWorkspace: observable,
      reports: observable,
      reportIdsByWorkspace: observable,
      reportHistory: observable,
      reportAttachments: observable,
      reportSummary: observable,
      summaryByWorkspace: observable,
      reportTemplates: observable,
      reportTemplateIdsByWorkspace: observable,
      researchProjects: observable,
      researchProjectIdsByWorkspace: observable,
      approvalFlows: observable,
      approvalFlowIdsByWorkspace: observable,
      approvalRequests: observable,
      approvalRequestIdsByWorkspace: observable,
      auditEvents: observable,
      auditEventIdsByWorkspace: observable,
      settings: observable,
      stages: observable,
      stageIdsByProject: observable,
      stageGate: observable,
      stageTransitions: observable,
      stageMaterials: observable,
      materialIdsByStage: observable,
      materialVersions: observable,
      stageRequirements: observable,
      // computed
      isEnabled: computed,
      isWorkspaceAdmin: computed,
      isOrgSectionEnabled: computed,
      isReportSectionEnabled: computed,
      isApprovalSectionEnabled: computed,
      isStageSectionEnabled: computed,
      // actions
      fetchIdentity: action,
      fetchOrgUnits: action,
      createOrgUnit: action,
      updateOrgUnit: action,
      deleteOrgUnit: action,
      fetchOrgUnitMembers: action,
      addOrgUnitMember: action,
      updateOrgUnitMember: action,
      removeOrgUnitMember: action,
      transferPi: action,
      fetchMentorBindings: action,
      createMentorBinding: action,
      deleteMentorBinding: action,
      fetchReports: action,
      createReport: action,
      fetchReport: action,
      submitReport: action,
      returnReport: action,
      acceptReport: action,
      fetchReportHistory: action,
      fetchReportAttachments: action,
      uploadReportAttachment: action,
      deleteReportAttachment: action,
      importReportMarkdown: action,
      updateReportVisibility: action,
      fetchReportSummary: action,
      fetchReportTemplates: action,
      createReportTemplate: action,
      updateReportTemplate: action,
      deleteReportTemplate: action,
      fetchResearchProjects: action,
      createResearchProject: action,
      archiveResearchProject: action,
      restoreResearchProject: action,
      fetchApprovalFlows: action,
      createApprovalFlow: action,
      fetchApprovalRequests: action,
      createApprovalRequest: action,
      approveApprovalRequest: action,
      rejectApprovalRequest: action,
      withdrawApprovalRequest: action,
      fetchAuditEvents: action,
      fetchSettings: action,
      updateSettings: action,
      // stage workflow (P1-A1)
      fetchProjectStages: action,
      createProjectStages: action,
      fetchStage: action,
      fetchStageGate: action,
      fetchStageTransitions: action,
      enterStage: action,
      submitStage: action,
      returnStage: action,
      passStage: action,
      reopenStage: action,
      fetchStageMaterials: action,
      createStageMaterial: action,
      fetchStageMaterial: action,
      updateStageMaterial: action,
      submitStageMaterial: action,
      fetchMaterialVersions: action,
      fetchStageRequirements: action,
      updateStageRequirements: action,
    });

    this.orgService = new ResearchOrgService();
    this.reportService = new ResearchReportService();
    this.projectService = new ResearchProjectService();
    this.approvalService = new ResearchApprovalService();
    this.platformService = new ResearchPlatformService();
    this.stageService = new ResearchStageService();
  }

  // ---------------------------------------------------------------------
  // computed
  // ---------------------------------------------------------------------

  get isEnabled() {
    return Boolean(this.identity?.module_enabled && this.identity?.workspace_enabled);
  }

  get isWorkspaceAdmin() {
    return Boolean(this.identity?.user?.is_workspace_admin);
  }

  get isOrgSectionEnabled() {
    return Boolean(this.isEnabled && this.identity?.sections?.org);
  }

  get isReportSectionEnabled() {
    return Boolean(this.isEnabled && this.identity?.sections?.reports);
  }

  get isApprovalSectionEnabled() {
    return Boolean(this.isEnabled && this.identity?.sections?.approvals);
  }

  get isStageSectionEnabled() {
    return Boolean(this.isEnabled && this.identity?.sections?.stages);
  }

  getOrgUnits = (workspaceSlug: string) =>
    (this.orgUnitIdsByWorkspace[workspaceSlug] ?? [])
      .map((id) => this.orgUnits[id])
      .filter((unit): unit is TOrgUnit => Boolean(unit));

  getReports = (workspaceSlug: string) =>
    (this.reportIdsByWorkspace[workspaceSlug] ?? [])
      .map((id) => this.reports[id])
      .filter((report): report is TPeriodicReport => Boolean(report));

  getResearchProjects = (workspaceSlug: string) =>
    (this.researchProjectIdsByWorkspace[workspaceSlug] ?? [])
      .map((id) => this.researchProjects[id])
      .filter((project): project is TResearchProject => Boolean(project));

  getApprovalRequests = (workspaceSlug: string) =>
    (this.approvalRequestIdsByWorkspace[workspaceSlug] ?? [])
      .map((id) => this.approvalRequests[id])
      .filter((request): request is TApprovalRequest => Boolean(request));

  getApprovalFlows = (workspaceSlug: string) =>
    (this.approvalFlowIdsByWorkspace[workspaceSlug] ?? [])
      .map((id) => this.approvalFlows[id])
      .filter((flow): flow is TApprovalFlow => Boolean(flow));

  getReportTemplates = (workspaceSlug: string) =>
    (this.reportTemplateIdsByWorkspace[workspaceSlug] ?? [])
      .map((id) => this.reportTemplates[id])
      .filter((template): template is TReportTemplate => Boolean(template));

  getAuditEvents = (workspaceSlug: string) =>
    (this.auditEventIdsByWorkspace[workspaceSlug] ?? [])
      .map((id) => this.auditEvents[id])
      .filter((event): event is TResearchAuditEvent => Boolean(event));

  getProjectStages = (workspaceSlug: string, projectId: string) =>
    (this.stageIdsByProject[`${workspaceSlug}:${projectId}`] ?? [])
      .map((id) => this.stages[id])
      .filter((stage): stage is TStageInstance => Boolean(stage));

  getStageMaterials = (stageId: string) =>
    (this.materialIdsByStage[stageId] ?? [])
      .map((id) => this.stageMaterials[id])
      .filter((material): material is TStageMaterial => Boolean(material));

  // ---------------------------------------------------------------------
  // identity
  // ---------------------------------------------------------------------

  fetchIdentity = async (workspaceSlug: string) => {
    this.identityLoader = true;
    try {
      const identity = await this.platformService.getIdentity(workspaceSlug);
      runInAction(() => {
        this.identity = identity;
        this.identityErrorCode = null;
      });
      return identity;
    } catch (error) {
      runInAction(() => {
        this.identity = null;
        this.identityErrorCode = (error as { error_code?: string } | null)?.error_code ?? "generic";
      });
      throw error;
    } finally {
      runInAction(() => {
        this.identityLoader = false;
      });
    }
  };

  // ---------------------------------------------------------------------
  // organisation tree
  // ---------------------------------------------------------------------

  fetchOrgUnits = async (workspaceSlug: string, options: { includeInactive?: boolean } = {}) => {
    this.orgLoader = true;
    try {
      const response = await this.orgService.getOrgUnits(workspaceSlug, {
        include_inactive: options.includeInactive,
      });
      runInAction(() => {
        response.results.forEach((unit) => {
          this.orgUnits[unit.id] = unit;
        });
        this.orgUnitIdsByWorkspace[workspaceSlug] = response.results.map((unit) => unit.id);
      });
      return response.results;
    } finally {
      runInAction(() => {
        this.orgLoader = false;
      });
    }
  };

  createOrgUnit = async (workspaceSlug: string, payload: TOrgUnitPayload) => {
    const unit = await this.orgService.createOrgUnit(workspaceSlug, payload);
    runInAction(() => {
      this.orgUnits[unit.id] = unit;
      this.orgUnitIdsByWorkspace[workspaceSlug] = [...(this.orgUnitIdsByWorkspace[workspaceSlug] ?? []), unit.id];
    });
    return unit;
  };

  updateOrgUnit = async (workspaceSlug: string, unitId: string, payload: TOrgUnitPayload) => {
    const unit = await this.orgService.updateOrgUnit(workspaceSlug, unitId, payload);
    runInAction(() => {
      this.orgUnits[unit.id] = unit;
    });
    // a move rewrites descendant paths, so the tree is reloaded
    if (payload.parent !== undefined) await this.fetchOrgUnits(workspaceSlug);
    return unit;
  };

  deleteOrgUnit = async (workspaceSlug: string, unitId: string) => {
    await this.orgService.deleteOrgUnit(workspaceSlug, unitId);
    await this.fetchOrgUnits(workspaceSlug);
  };

  fetchOrgUnitMembers = async (workspaceSlug: string, unitId: string) => {
    const response = await this.orgService.getOrgUnitMembers(workspaceSlug, unitId);
    runInAction(() => {
      this.orgUnitMembers[unitId] = response.results;
    });
    return response.results;
  };

  addOrgUnitMember = async (
    workspaceSlug: string,
    unitId: string,
    payload: { user: string; org_role: string; is_primary?: boolean; effective_to?: string | null }
  ) => {
    await this.orgService.addOrgUnitMember(workspaceSlug, unitId, payload);
    await this.fetchOrgUnitMembers(workspaceSlug, unitId);
  };

  updateOrgUnitMember = async (
    workspaceSlug: string,
    unitId: string,
    memberId: string,
    payload: Partial<TOrgUnitMember>
  ) => {
    await this.orgService.updateOrgUnitMember(workspaceSlug, unitId, memberId, payload);
    await this.fetchOrgUnitMembers(workspaceSlug, unitId);
  };

  removeOrgUnitMember = async (workspaceSlug: string, unitId: string, memberId: string) => {
    await this.orgService.removeOrgUnitMember(workspaceSlug, unitId, memberId);
    await this.fetchOrgUnitMembers(workspaceSlug, unitId);
  };

  transferPi = async (workspaceSlug: string, unitId: string, userIds: string[]) => {
    await this.orgService.transferPi(workspaceSlug, unitId, userIds);
    await this.fetchOrgUnitMembers(workspaceSlug, unitId);
  };

  fetchMentorBindings = async (
    workspaceSlug: string,
    params: { mentee?: string; mentor?: string; org_unit?: string } = {}
  ) => {
    const response = await this.orgService.getMentorBindings(workspaceSlug, { ...params, active_only: true });
    runInAction(() => {
      response.results.forEach((binding) => {
        this.mentorBindings[binding.id] = binding;
      });
      if (!params.mentee && !params.mentor && !params.org_unit) {
        this.mentorBindingIdsByWorkspace[workspaceSlug] = response.results.map((binding) => binding.id);
      }
    });
    return response.results;
  };

  createMentorBinding = async (
    workspaceSlug: string,
    payload: { mentee: string; mentor: string; org_unit?: string | null }
  ) => {
    await this.orgService.createMentorBinding(workspaceSlug, payload);
    await this.fetchMentorBindings(workspaceSlug);
  };

  deleteMentorBinding = async (workspaceSlug: string, bindingId: string) => {
    await this.orgService.deleteMentorBinding(workspaceSlug, bindingId);
    await this.fetchMentorBindings(workspaceSlug);
  };

  // ---------------------------------------------------------------------
  // reports
  // ---------------------------------------------------------------------

  fetchReports = async (workspaceSlug: string, params: TReportListParams = {}) => {
    this.reportLoader = true;
    try {
      const response = await this.reportService.getReports(workspaceSlug, params);
      runInAction(() => {
        response.results.forEach((report) => {
          this.reports[report.id] = report;
        });
        this.reportIdsByWorkspace[workspaceSlug] = response.results.map((report) => report.id);
      });
      return response.results;
    } finally {
      runInAction(() => {
        this.reportLoader = false;
      });
    }
  };

  createReport = async (workspaceSlug: string, payload: TReportCreatePayload) => {
    const report = await this.reportService.createReport(workspaceSlug, payload);
    runInAction(() => {
      this.reports[report.id] = report;
      this.reportIdsByWorkspace[workspaceSlug] = [report.id, ...(this.reportIdsByWorkspace[workspaceSlug] ?? [])];
    });
    return report;
  };

  fetchReport = async (workspaceSlug: string, reportId: string) => {
    const report = await this.reportService.getReport(workspaceSlug, reportId);
    runInAction(() => {
      this.reports[report.id] = report;
    });
    return report;
  };

  submitReport = async (workspaceSlug: string, reportId: string) => {
    const report = await this.reportService.submitReport(workspaceSlug, reportId);
    runInAction(() => {
      this.reports[report.id] = report;
    });
    await this.fetchReportHistory(workspaceSlug, reportId);
    return report;
  };

  returnReport = async (workspaceSlug: string, reportId: string, comment: string) => {
    const report = await this.reportService.returnReport(workspaceSlug, reportId, comment);
    runInAction(() => {
      this.reports[report.id] = report;
    });
    await this.fetchReportHistory(workspaceSlug, reportId);
    return report;
  };

  acceptReport = async (workspaceSlug: string, reportId: string) => {
    const report = await this.reportService.acceptReport(workspaceSlug, reportId);
    runInAction(() => {
      this.reports[report.id] = report;
    });
    await this.fetchReportHistory(workspaceSlug, reportId);
    return report;
  };

  fetchReportHistory = async (workspaceSlug: string, reportId: string) => {
    const response = await this.reportService.getReportHistory(workspaceSlug, reportId);
    runInAction(() => {
      this.reportHistory[reportId] = response.results;
    });
    return response.results;
  };

  fetchReportAttachments = async (workspaceSlug: string, reportId: string) => {
    const response = await this.reportService.getReportAttachments(workspaceSlug, reportId);
    runInAction(() => {
      this.reportAttachments[reportId] = response.results;
    });
    return response.results;
  };

  uploadReportAttachment = async (
    workspaceSlug: string,
    reportId: string,
    file: { file_name: string; content_type: string; size: number; body: Blob }
  ) => {
    const presigned = await this.reportService.presignReportAttachment(workspaceSlug, reportId, {
      file_name: file.file_name,
      content_type: file.content_type,
      size: file.size,
    });
    const formData = new FormData();
    Object.entries(presigned.upload_data.fields ?? {}).forEach(([key, value]) => formData.append(key, value));
    formData.append("file", file.body);
    const uploadResponse = await fetch(presigned.upload_data.url, { method: "POST", body: formData });
    if (!uploadResponse.ok) throw new Error("upload_failed");
    await this.reportService.registerReportAttachment(workspaceSlug, reportId, {
      asset_id: presigned.asset_id,
    });
    await this.fetchReportAttachments(workspaceSlug, reportId);
  };

  deleteReportAttachment = async (workspaceSlug: string, reportId: string, attachmentId: string) => {
    await this.reportService.deleteReportAttachment(workspaceSlug, reportId, attachmentId);
    await this.fetchReportAttachments(workspaceSlug, reportId);
  };

  importReportMarkdown = async (
    workspaceSlug: string,
    reportId: string,
    payload: { content: string; file_name?: string }
  ) => {
    const result = (await this.reportService.importMarkdown(workspaceSlug, reportId, payload)) as {
      local_images?: string[];
    };
    await this.fetchReport(workspaceSlug, reportId);
    return result?.local_images ?? [];
  };

  updateReportVisibility = async (
    workspaceSlug: string,
    reportId: string,
    visibility: string,
    grants?: { grantee_user?: string; grantee_org_unit?: string }[]
  ) => {
    await this.reportService.updateReportAccess(workspaceSlug, reportId, { visibility, grants });
    await this.fetchReport(workspaceSlug, reportId);
  };

  fetchReportSummary = async (
    workspaceSlug: string,
    params: { period_key?: string; report_type?: string; org_unit?: string } = {}
  ) => {
    const summary = await this.reportService.getSummary(workspaceSlug, params);
    runInAction(() => {
      const key = `${workspaceSlug}:${params.org_unit ?? "all"}`;
      this.reportSummary[key] = summary;
      this.summaryByWorkspace[workspaceSlug] = summary;
    });
    return summary;
  };

  fetchReportTemplates = async (workspaceSlug: string) => {
    this.templatesLoader = true;
    try {
      const response = await this.reportService.getTemplates(workspaceSlug);
      runInAction(() => {
        response.results.forEach((template) => {
          this.reportTemplates[template.id] = template;
        });
        this.reportTemplateIdsByWorkspace[workspaceSlug] = response.results.map((template) => template.id);
      });
      return response.results;
    } finally {
      runInAction(() => {
        this.templatesLoader = false;
      });
    }
  };

  createReportTemplate = async (
    workspaceSlug: string,
    payload: { name: string; report_type: string; is_default?: boolean }
  ) => {
    const template = await this.reportService.createTemplate(workspaceSlug, payload);
    await this.fetchReportTemplates(workspaceSlug);
    return template;
  };

  updateReportTemplate = async (workspaceSlug: string, templateId: string, payload: Partial<TReportTemplate>) => {
    const template = await this.reportService.updateTemplate(workspaceSlug, templateId, payload);
    await this.fetchReportTemplates(workspaceSlug);
    return template;
  };

  deleteReportTemplate = async (workspaceSlug: string, templateId: string) => {
    await this.reportService.deleteTemplate(workspaceSlug, templateId);
    await this.fetchReportTemplates(workspaceSlug);
  };

  // ---------------------------------------------------------------------
  // research projects
  // ---------------------------------------------------------------------

  fetchResearchProjects = async (workspaceSlug: string, params: Record<string, string> = {}) => {
    this.projectLoader = true;
    try {
      const response = await this.projectService.getProjects(workspaceSlug, params);
      runInAction(() => {
        response.results.forEach((project) => {
          this.researchProjects[project.id] = project;
        });
        this.researchProjectIdsByWorkspace[workspaceSlug] = response.results.map((project) => project.id);
      });
      return response.results;
    } finally {
      runInAction(() => {
        this.projectLoader = false;
      });
    }
  };

  createResearchProject = async (workspaceSlug: string, payload: TResearchProjectCreatePayload) => {
    const project = await this.projectService.createProject(workspaceSlug, payload);
    await this.fetchResearchProjects(workspaceSlug);
    return project;
  };

  archiveResearchProject = async (workspaceSlug: string, projectId: string) => {
    await this.projectService.archiveProject(workspaceSlug, projectId);
    await this.fetchResearchProjects(workspaceSlug);
  };

  restoreResearchProject = async (workspaceSlug: string, projectId: string) => {
    await this.projectService.restoreProject(workspaceSlug, projectId);
    await this.fetchResearchProjects(workspaceSlug);
  };

  // ---------------------------------------------------------------------
  // approvals
  // ---------------------------------------------------------------------

  fetchApprovalFlows = async (workspaceSlug: string) => {
    const response = await this.approvalService.getApprovalFlows(workspaceSlug);
    runInAction(() => {
      response.results.forEach((flow) => {
        this.approvalFlows[flow.id] = flow;
      });
      this.approvalFlowIdsByWorkspace[workspaceSlug] = response.results.map((flow) => flow.id);
    });
    return response.results;
  };

  createApprovalFlow = async (
    workspaceSlug: string,
    payload: Parameters<ResearchApprovalService["createApprovalFlow"]>[1]
  ) => {
    const flow = await this.approvalService.createApprovalFlow(workspaceSlug, payload);
    await this.fetchApprovalFlows(workspaceSlug);
    return flow;
  };

  fetchApprovalRequests = async (workspaceSlug: string, scope?: string) => {
    this.approvalLoader = true;
    try {
      const response = await this.approvalService.getApprovalRequests(workspaceSlug, { scope });
      runInAction(() => {
        response.results.forEach((request) => {
          this.approvalRequests[request.id] = request;
        });
        this.approvalRequestIdsByWorkspace[workspaceSlug] = response.results.map((request) => request.id);
      });
      return response.results;
    } finally {
      runInAction(() => {
        this.approvalLoader = false;
      });
    }
  };

  createApprovalRequest = async (
    workspaceSlug: string,
    payload: Parameters<ResearchApprovalService["createApprovalRequest"]>[1]
  ) => {
    const request = await this.approvalService.createApprovalRequest(workspaceSlug, payload);
    await this.fetchApprovalRequests(workspaceSlug);
    return request;
  };

  approveApprovalRequest = async (workspaceSlug: string, requestId: string, comment = "") => {
    const request = await this.approvalService.approveRequest(workspaceSlug, requestId, comment);
    runInAction(() => {
      this.approvalRequests[request.id] = request;
    });
    return request;
  };

  rejectApprovalRequest = async (workspaceSlug: string, requestId: string, comment: string) => {
    const request = await this.approvalService.rejectRequest(workspaceSlug, requestId, comment);
    runInAction(() => {
      this.approvalRequests[request.id] = request;
    });
    return request;
  };

  withdrawApprovalRequest = async (workspaceSlug: string, requestId: string) => {
    const request = await this.approvalService.withdrawRequest(workspaceSlug, requestId);
    runInAction(() => {
      this.approvalRequests[request.id] = request;
    });
    return request;
  };

  // ---------------------------------------------------------------------
  // audit
  // ---------------------------------------------------------------------

  fetchAuditEvents = async (workspaceSlug: string, params: Record<string, string> = {}) => {
    this.auditLoader = true;
    try {
      const response = await this.platformService.getAuditEvents(workspaceSlug, params);
      runInAction(() => {
        response.results.forEach((event) => {
          this.auditEvents[event.id] = event;
        });
        this.auditEventIdsByWorkspace[workspaceSlug] = response.results.map((event) => event.id);
      });
      return response.results;
    } finally {
      runInAction(() => {
        this.auditLoader = false;
      });
    }
  };

  // ---------------------------------------------------------------------
  // platform settings
  // ---------------------------------------------------------------------

  fetchSettings = async (workspaceSlug: string) => {
    try {
      const settings = await this.platformService.getSettings(workspaceSlug);
      runInAction(() => {
        this.settings[workspaceSlug] = settings;
      });
      return settings;
    } catch {
      return null;
    }
  };

  updateSettings = async (workspaceSlug: string, payload: Partial<TWorkspaceResearchSetting>) => {
    const settings = await this.platformService.updateSettings(workspaceSlug, payload);
    runInAction(() => {
      this.settings[workspaceSlug] = settings;
    });
    return settings;
  };

  // ---------------------------------------------------------------------
  // stage workflow (P1-A1)
  // ---------------------------------------------------------------------

  private applyStages = (workspaceSlug: string, projectId: string, stages: TStageInstance[]) => {
    runInAction(() => {
      this.stageIdsByProject[`${workspaceSlug}:${projectId}`] = stages.map((stage) => stage.id);
      stages.forEach((stage) => {
        this.stages[stage.id] = { ...this.stages[stage.id], ...stage };
        if (stage.materials) {
          this.materialIdsByStage[stage.id] = stage.materials.map((material) => material.id);
          stage.materials.forEach((material) => {
            this.stageMaterials[material.id] = { ...this.stageMaterials[material.id], ...material };
          });
        }
      });
    });
  };

  fetchProjectStages = async (workspaceSlug: string, projectId: string) => {
    this.stageLoader = true;
    try {
      const response = await this.stageService.getProjectStages(workspaceSlug, projectId);
      this.applyStages(workspaceSlug, projectId, response.results);
      return response.results;
    } finally {
      runInAction(() => {
        this.stageLoader = false;
      });
    }
  };

  createProjectStages = async (workspaceSlug: string, projectId: string) => {
    const response = await this.stageService.createProjectStages(workspaceSlug, projectId);
    this.applyStages(workspaceSlug, projectId, response.results);
    return response.results;
  };

  fetchStage = async (workspaceSlug: string, stageId: string) => {
    this.stageLoader = true;
    try {
      const stage = await this.stageService.getStage(workspaceSlug, stageId);
      runInAction(() => {
        this.stages[stage.id] = { ...this.stages[stage.id], ...stage };
        if (stage.materials) {
          this.materialIdsByStage[stage.id] = stage.materials.map((material) => material.id);
          stage.materials.forEach((material) => {
            this.stageMaterials[material.id] = { ...this.stageMaterials[material.id], ...material };
          });
        }
        if (stage.transitions) this.stageTransitions[stage.id] = stage.transitions;
        if (stage.gate) this.stageGate[stage.id] = stage.gate;
      });
      return stage;
    } finally {
      runInAction(() => {
        this.stageLoader = false;
      });
    }
  };

  fetchStageGate = async (workspaceSlug: string, stageId: string, phase: TStageGatePhase = "submit") => {
    const gate = await this.stageService.getGate(workspaceSlug, stageId, phase);
    runInAction(() => {
      if (phase === "submit") this.stageGate[stageId] = gate;
    });
    return gate;
  };

  fetchStageTransitions = async (workspaceSlug: string, stageId: string) => {
    const response = await this.stageService.getTransitions(workspaceSlug, stageId);
    runInAction(() => {
      this.stageTransitions[stageId] = response.results;
    });
    return response.results;
  };

  private refreshStage = async (workspaceSlug: string, stage: TStageInstance) => {
    runInAction(() => {
      this.stages[stage.id] = { ...this.stages[stage.id], ...stage };
    });
    // stage transitions change the gate, the history and the project overview
    await Promise.all([
      this.fetchStageGate(workspaceSlug, stage.id).catch(() => undefined),
      this.fetchStageTransitions(workspaceSlug, stage.id).catch(() => undefined),
      this.fetchStageMaterials(workspaceSlug, stage.id).catch(() => undefined),
    ]);
    return this.stages[stage.id];
  };

  enterStage = async (workspaceSlug: string, stageId: string) => {
    const stage = await this.stageService.enterStage(workspaceSlug, stageId);
    return this.refreshStage(workspaceSlug, stage);
  };

  submitStage = async (workspaceSlug: string, stageId: string) => {
    const stage = await this.stageService.submitStage(workspaceSlug, stageId);
    return this.refreshStage(workspaceSlug, stage);
  };

  returnStage = async (workspaceSlug: string, stageId: string, reason: string) => {
    const stage = await this.stageService.returnStage(workspaceSlug, stageId, reason);
    return this.refreshStage(workspaceSlug, stage);
  };

  passStage = async (workspaceSlug: string, stageId: string) => {
    const stage = await this.stageService.passStage(workspaceSlug, stageId);
    return this.refreshStage(workspaceSlug, stage);
  };

  reopenStage = async (workspaceSlug: string, stageId: string, reason: string, confirm = false) => {
    const stage = await this.stageService.reopenStage(workspaceSlug, stageId, reason, confirm);
    return this.refreshStage(workspaceSlug, stage);
  };

  fetchStageMaterials = async (workspaceSlug: string, stageId: string) => {
    const response = await this.stageService.getMaterials(workspaceSlug, stageId);
    runInAction(() => {
      this.materialIdsByStage[stageId] = response.results.map((material) => material.id);
      response.results.forEach((material) => {
        this.stageMaterials[material.id] = { ...this.stageMaterials[material.id], ...material };
      });
    });
    return response.results;
  };

  createStageMaterial = async (workspaceSlug: string, stageId: string, payload: TStageMaterialCreatePayload) => {
    const material = await this.stageService.createMaterial(workspaceSlug, stageId, payload);
    runInAction(() => {
      this.stageMaterials[material.id] = material;
      this.materialIdsByStage[stageId] = [...(this.materialIdsByStage[stageId] ?? []), material.id];
    });
    return material;
  };

  fetchStageMaterial = async (workspaceSlug: string, materialId: string) => {
    const material = await this.stageService.getMaterial(workspaceSlug, materialId);
    runInAction(() => {
      this.stageMaterials[material.id] = { ...this.stageMaterials[material.id], ...material };
    });
    return material;
  };

  updateStageMaterial = async (workspaceSlug: string, materialId: string, payload: TStageMaterialUpdatePayload) => {
    const material = await this.stageService.updateMaterial(workspaceSlug, materialId, payload);
    runInAction(() => {
      this.stageMaterials[material.id] = { ...this.stageMaterials[material.id], ...material };
    });
    return material;
  };

  submitStageMaterial = async (workspaceSlug: string, materialId: string) => {
    const material = await this.stageService.submitMaterial(workspaceSlug, materialId);
    runInAction(() => {
      this.stageMaterials[material.id] = { ...this.stageMaterials[material.id], ...material };
    });
    return material;
  };

  fetchMaterialVersions = async (workspaceSlug: string, materialId: string) => {
    const response = await this.stageService.getMaterialVersions(workspaceSlug, materialId);
    runInAction(() => {
      this.materialVersions[materialId] = response.results;
    });
    return response.results;
  };

  fetchStageRequirements = async (workspaceSlug: string, stage?: string) => {
    const response = await this.stageService.getStageRequirements(workspaceSlug, stage);
    runInAction(() => {
      this.stageRequirements[stage ?? "all"] = response.results;
    });
    return response.results;
  };

  updateStageRequirements = async (workspaceSlug: string, items: TStageRequirementUpdate[]) => {
    await this.stageService.updateStageRequirements(workspaceSlug, items);
    await this.fetchStageRequirements(workspaceSlug);
  };
}
