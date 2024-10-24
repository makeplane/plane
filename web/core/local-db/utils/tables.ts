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
  //@todo use promise.all or send all statements in one go
  await persistence.db.exec("BEGIN;");

  await persistence.db.exec(createTableSQLfromSchema("issues", issueSchema));
  await persistence.db.exec(createTableSQLfromSchema("issue_meta", issueMetaSchema));
  await persistence.db.exec(createTableSQLfromSchema("modules", moduleSchema));
  await persistence.db.exec(createTableSQLfromSchema("labels", labelSchema));
  await persistence.db.exec(createTableSQLfromSchema("states", stateSchema));
  await persistence.db.exec(createTableSQLfromSchema("cycles", cycleSchema));
  await persistence.db.exec(createTableSQLfromSchema("estimate_points", estimatePointSchema));
  await persistence.db.exec(createTableSQLfromSchema("members", memberSchema));
  await persistence.db.exec(createTableSQLfromSchema("options", optionsSchema));

  await persistence.db.exec("COMMIT;");
};
