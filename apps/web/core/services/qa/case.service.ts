// plane imports
import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";
import type { AxiosRequestConfig } from "axios";
import { getFileMetaDataForUpload, generateFileUploadPayload } from "@plane/services";
import { FileUploadService } from "@/services/file-upload.service";


export type ModuleCountResponse = { total: number } & Record<string, number>;

export class CaseService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getCases(workspaceSlug: string, queries?: any): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/case/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createCase(workspaceSlug: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/test/case/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCase(workspaceSlug: string, caseId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/case/${caseId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateCase(workspaceSlug: string, caseId: string, data: any): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/test/case/${caseId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteCase(workspaceSlug: string, caseId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/test/case/${caseId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  private fileUploadService: FileUploadService = new FileUploadService();

  private async updateCaseAttachmentUploadStatus(
    workspaceSlug: string,
    projectId: string,
    caseId: string,
    attachmentId: string
  ): Promise<void> {
    return this.patch(
      `/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/cases/${caseId}/attachments/${attachmentId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async uploadCaseAttachment(
    workspaceSlug: string,
    projectId: string,
    caseId: string,
    file: File,
    uploadProgressHandler?: AxiosRequestConfig["onUploadProgress"]
  ): Promise<any> {
    const fileMetaData = await getFileMetaDataForUpload(file);
    return this.post(
      `/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/cases/${caseId}/attachments/`,
      fileMetaData
    )
      .then(async (response) => {
        const signedURLResponse = response?.data;
        const fileUploadPayload = generateFileUploadPayload(signedURLResponse, file);
        await this.fileUploadService.uploadFile(
          signedURLResponse.upload_data.url,
          fileUploadPayload,
          uploadProgressHandler
        );
        await this.updateCaseAttachmentUploadStatus(workspaceSlug, projectId, caseId, signedURLResponse.asset_id);
        return signedURLResponse.attachment;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCaseAttachments(workspaceSlug: string, projectId: string, caseId: string): Promise<any[]> {
    return this.get(
      `/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/cases/${caseId}/attachments/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteCaseAttachment(
    workspaceSlug: string,
    projectId: string,
    caseId: string,
    assetId: string
  ): Promise<any> {
    return this.delete(
      `/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/cases/${caseId}/attachments/${assetId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  // 新增：删除尚未绑定到用例的工作空间资产
  async deleteWorkspaceAsset(workspaceSlug: string, assetId: string): Promise<any> {
    return this.delete(`/api/assets/v2/workspaces/${workspaceSlug}/${assetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  // 新增：获取模块列表，支持按 repositoryId 过滤
  async getModules(workspaceSlug: string, repositoryId: string): Promise<any[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/module/?repository_id=${repositoryId}`)
      .then((response) => response?.data || [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createModules(workspaceSlug: string, data: any): Promise<any[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/test/module/`, data)
      .then((response) => response?.data || [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteModules(workspaceSlug: string, moduleId: string): Promise<any[]> {
    return this.delete(`/api/workspaces/${workspaceSlug}/test/module/?id=${moduleId}`)
      .then((response) => response?.data || [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }



  async getModulesCount(workspaceSlug: string, repositoryId: string): Promise<Partial<ModuleCountResponse>> {
    const params = {repository_id:repositoryId}
    return this.get(`/api/workspaces/${workspaceSlug}/test/module/count/`,{params})
      .then((response) => (response?.data ?? {}) as Partial<ModuleCountResponse>)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}