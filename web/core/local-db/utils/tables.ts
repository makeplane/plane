import { persistence } from "../storage.sqlite";
import {
  labelSchema,
  moduleSchema,
  Schema,
  issueMetaSchema,
  issueSchema,
  stateSchema,
  cycleSchema,
  estimatePointSchema,
  memberSchema,
  optionsSchema,
} from "./schemas";
import { log } from "./utils";

const createTableSQLfromSchema = (tableName: string, schema: Schema) => {
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (`;
  sql += Object.keys(schema)
    .map((key) => `'${key}' ${schema[key]}`)
    .join(", ");
  sql += `);`;
  log("#####", sql);
  return sql;
};

export const createTables = async () => {
  persistence.db.exec("BEGIN TRANSACTION;");

  persistence.db.exec(createTableSQLfromSchema("issues", issueSchema));
  persistence.db.exec(createTableSQLfromSchema("issue_meta", issueMetaSchema));
  persistence.db.exec(createTableSQLfromSchema("modules", moduleSchema));
  persistence.db.exec(createTableSQLfromSchema("labels", labelSchema));
  persistence.db.exec(createTableSQLfromSchema("states", stateSchema));
  persistence.db.exec(createTableSQLfromSchema("cycles", cycleSchema));
  persistence.db.exec(createTableSQLfromSchema("estimate_points", estimatePointSchema));
  persistence.db.exec(createTableSQLfromSchema("members", memberSchema));
  persistence.db.exec(createTableSQLfromSchema("options", optionsSchema));

  persistence.db.exec("COMMIT;");
};
