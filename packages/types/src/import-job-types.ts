export type TImportJob<TJobConfig = object> = {
    id: string;
    created_at: string;
    updated_at?: string | null;
    source: string;
    config: TJobConfig;
    report: TImportReport;
    credential_id: string;
    project_id: string;
    workspace_id: string;
    workspace_slug: string;
    initiator_id: string;
    report_id: string;
    status: string;
    with_issue_types: boolean;
    cancelled_at?: string | null;
    success_metadata: object;
    error_metadata: object;
    relation_map: object; // "issues" -> taskExternalId -> relations
}

export type TImportReport = {
    // Identifier
    id: string;

    // Overall Insight
    batch_size: number;
    total_batch_count: number;
    imported_batch_count: number;
    transformed_batch_count: number;
    completed_batch_count: number;
    errored_batch_count: number;

    // Entity Information
    total_issue_count: number;
    imported_issue_count: number;
    errored_issue_count: number;
    total_page_count: number;
    imported_page_count: number;
    errored_page_count: number;

    // Time Stamps
    start_time?: string | null;
    end_time?: string | null;
}
