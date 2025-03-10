import { RecordWithLinks } from "@flatfile/api/api";
import { FlatfileService } from "../services/api.service";
import { TExtractedRecord } from "../types";
import { extractRecord } from "./transform";

/**
 * @function pullSheetRecords
 * @description Pulls and processes all records from a specified Flatfile workbook
 * @param {FlatfileService} service - The Flatfile service instance to use for API calls
 * @param {string} workbookId - ID of the workbook to pull records from
 * @returns {Promise<TExtractedRecord>} Array of extracted and transformed records
 * @throws {Error} If records cannot be pulled or processed
 */
export const pullSheetRecords = async (service: FlatfileService, workbookId: string): Promise<TExtractedRecord[]> => {
  const recordMap = await service.getWorkbookRecords(workbookId);
  const records: RecordWithLinks[] = [];

  Object.values(recordMap).map((record) => records.push(...record));

  const extractedRecords = records.map((record) => extractRecord(record));
  return extractedRecords;
};
