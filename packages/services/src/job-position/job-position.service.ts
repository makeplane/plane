import type {
  IJobGrade,
  IJobGradeCreate,
  IJobGradeUpdate,
  IJobPosition,
  IJobPositionCreate,
  IJobPositionUpdate,
  IJobPositionBulkImportRequest,
  IJobPositionBulkImportResponse,
} from "@plane/types";
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "../api.service";

export class JobPositionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // ── Job grades — standalone parent ───────────────────────────────────

  async listGrades(): Promise<IJobGrade[]> {
    return this.get("/api/instances/job-positions/grades/")
      .then((res) => res?.data)
      .catch((err) => { throw err?.response?.data; });
  }

  async createGrade(data: IJobGradeCreate): Promise<IJobGrade> {
    return this.post("/api/instances/job-positions/grades/", data)
      .then((res) => res?.data)
      .catch((err) => { throw err?.response?.data; });
  }

  async updateGrade(id: string, data: IJobGradeUpdate): Promise<IJobGrade> {
    return this.patch(`/api/instances/job-positions/grades/${id}/`, data)
      .then((res) => res?.data)
      .catch((err) => { throw err?.response?.data; });
  }

  async deleteGrade(id: string): Promise<void> {
    return this.delete(`/api/instances/job-positions/grades/${id}/`)
      .then((res) => res?.data)
      .catch((err) => { throw err?.response?.data; });
  }

  // ── Job positions — child of job grade ───────────────────────────────

  async listPositions(jobGradeId?: string): Promise<IJobPosition[]> {
    const params = jobGradeId ? `?job_grade_id=${jobGradeId}` : "";
    return this.get(`/api/instances/job-positions/${params}`)
      .then((res) => res?.data)
      .catch((err) => { throw err?.response?.data; });
  }

  async createPosition(data: IJobPositionCreate): Promise<IJobPosition> {
    return this.post("/api/instances/job-positions/", data)
      .then((res) => res?.data)
      .catch((err) => { throw err?.response?.data; });
  }

  async updatePosition(id: string, data: IJobPositionUpdate): Promise<IJobPosition> {
    return this.patch(`/api/instances/job-positions/${id}/`, data)
      .then((res) => res?.data)
      .catch((err) => { throw err?.response?.data; });
  }

  async deletePosition(id: string): Promise<void> {
    return this.delete(`/api/instances/job-positions/${id}/`)
      .then((res) => res?.data)
      .catch((err) => { throw err?.response?.data; });
  }

  async bulkImport(data: IJobPositionBulkImportRequest): Promise<IJobPositionBulkImportResponse> {
    return this.post("/api/instances/job-positions/bulk-import/", data)
      .then((res) => res?.data)
      .catch((err) => { throw err?.response?.data; });
  }
}
