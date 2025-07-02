import { env } from "@/env";
import { ImportReportAPIService } from "@/services/job/import-job-report.service";
import { ImportJobAPIService } from "@/services/job/import-job.service";

// types
import { WorkspaceConnectionAPIService } from "@/services/workspace/connection.service";
import { WorkspaceCredentialAPIService } from "@/services/workspace/credential.service";
import { WorkspaceEntityConnectionAPIService } from "@/services/workspace/entity-connection.service";
import { ClientOptions } from "@/types";
import { PageAPIService } from "./page/page.service";


export class APIClient {
    options: ClientOptions;
    importJob: ImportJobAPIService;
    importReport: ImportReportAPIService;
    workspaceConnection: WorkspaceConnectionAPIService;
    workspaceCredential: WorkspaceCredentialAPIService;
    workspaceEntityConnection: WorkspaceEntityConnectionAPIService;
    // App level services
    page: PageAPIService;

    constructor(options: ClientOptions) {
        this.options = options;
        this.workspaceConnection = new WorkspaceConnectionAPIService(options);
        this.workspaceCredential = new WorkspaceCredentialAPIService(options);
        this.workspaceEntityConnection = new WorkspaceEntityConnectionAPIService(options);
        this.importJob = new ImportJobAPIService(options);
        this.importReport = new ImportReportAPIService(options);
        this.page = new PageAPIService(options);
    }
}


let apiClient: APIClient | null = null;

export const getAPIClient = (baseUrl?: string): APIClient => {
    if (!apiClient) {
        apiClient = new APIClient({
            baseURL: baseUrl || env.API_BASE_URL,
            hmacPrivateKey: env.SILO_HMAC_SECRET_KEY,
            serviceName: "SILO",
        });
    }
    return apiClient;
};
