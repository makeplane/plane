import { IssueLabelService } from "@/services/issue/issue_label.service";
import { persistence } from "../storage.sqlite";

const stageLabelInserts = (label: any) => {
  const { id, name, color, parent = "", project_id, sort_order, workspace_id } = label;

  const query = `INSERT OR REPLACE INTO labels (id, name, color, parent, project_id, sort_order, workspace_id) VALUES ('${id}', '${name}', '${color}', '${parent}', '${project_id}', '${sort_order}', '${workspace_id}');`;
  persistence.db.exec(query);
};
export const loadLabels = async (workspaceSlug: string, batchSize = 500) => {
  const issueLabelService = new IssueLabelService();
  const labels = await issueLabelService.getWorkspaceIssueLabels(workspaceSlug);
  for (let i = 0; i < labels.length; i += batchSize) {
    const batch = labels.slice(i, i + batchSize);

    persistence.db.exec("BEGIN TRANSACTION;");
    batch.forEach((issue: any) => {
      stageLabelInserts(issue);
    });
    await persistence.db.exec("COMMIT;");
  }
};
