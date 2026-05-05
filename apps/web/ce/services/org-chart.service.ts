import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export interface IOrgChartDepartment {
  id: string;
  name: string;
  code: string;
  short_name: string;
  dept_code: string;
  level: number;
  parent: string | null;
  manager: string | null;
  manager_detail: { id: string; display_name: string; email: string } | null;
  linked_workspace: string | null;
  linked_workspace_detail: { id: string; name: string; slug: string } | null;
  staff_count: number;
  is_linked: boolean;
  sort_order: number;
  is_active: boolean;
  children: IOrgChartDepartment[];
}

export class OrgChartService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getOrgChart(workspaceSlug: string): Promise<IOrgChartDepartment[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/org-chart/`)
      .then((res: { data: IOrgChartDepartment[] }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }
}
