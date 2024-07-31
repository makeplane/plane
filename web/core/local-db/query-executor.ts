import { SQL } from "./sqlite";

export const runQuery = async (sql) => {
  const data = await SQL.db.exec({
    // sql: `SELECT name, '[' || GROUP_CONCAT('"' || value || '"') || ']' AS label_ids FROM issues LEFT JOIN issue_meta ON issues.id = issue_meta.issue_id WHERE key='label_ids' AND value IN ('2e2a79d1-241a-4708-bf95-95eefa33a501','67970b7d-0525-48fa-9f7e-10fc086f5122')`,
    // sql: `SELECT * FROM issues LEFT JOIN issue_meta ON issues.id = issue_meta.issue_id WHERE key='label_ids' AND value IN ('2e2a79d1-241a-4708-bf95-95eefa33a501','67970b7d-0525-48fa-9f7e-10fc086f5122')`,
    sql,

    // key=label_ids AND value in ('2e2a79d1-241a-4708-bf95-95eefa33a501','67970b7d-0525-48fa-9f7e-10fc086f5122')`,
    rowMode: "object",
    returnValue: "resultRows",
  });

  return data.result.resultRows;
};
