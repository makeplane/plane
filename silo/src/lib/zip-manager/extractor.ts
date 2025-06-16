import zlib from 'zlib';
import { logger } from '@/logger';
import { ZipStream } from './zip-stream';

// ======================= PUBLIC API FUNCTIONS ======================= //

/**
 * Extracts a table of contents (list of all filenames) from a ZIP file
 * without fully extracting the archive's contents.
 *
 * This function works by directly parsing the ZIP file format structure:
 * 1. Locates the End of Central Directory (EOCD) record
 * 2. Finds the Central Directory using information from the EOCD
 * 3. Parses each file entry from the Central Directory
 *
 * @param zipStream - Stream interface to access the ZIP file
 * @returns Promise resolving to an array of filenames in the ZIP
 */
export async function extractZipTableOfContents(zipStream: ZipStream): Promise<string[]> {
  try {
    const fileSize = zipStream.size;

    // Find the end of central directory record
    const endOfCentralDirData = await findEndOfCentralDirectory(zipStream, fileSize);

    // Extract central directory information
    const { centralDirOffset, centralDirSize, entriesCount } = readCentralDirectoryInfo(endOfCentralDirData.chunk, endOfCentralDirData.offset);

    logger.info(`Central directory: offset=${centralDirOffset}, size=${centralDirSize}, entries=${entriesCount}`);

    // Read the central directory data
    await zipStream.seek(centralDirOffset);
    const centralDirData = await zipStream.read(centralDirSize);

    // Parse all entries from the central directory
    const entries = parseCentralDirectoryEntries(centralDirData, entriesCount);

    logger.info(`Found ${entries.length} entries in ZIP`);
    return entries;
  } catch (error) {
    logger.error('Failed to extract ZIP table of contents:', error);
    throw error;
  }
}

/**
 * Extracts a specific file from a ZIP archive.
 *
 * This function locates a file by name within the ZIP structure and extracts its contents,
 * handling decompression if necessary.
 *
 * @param zipStream - Stream interface to access the ZIP file
 * @param targetFileName - Name of the file to extract from the ZIP
 * @returns Promise resolving to a Buffer containing the file contents
 */
export async function extractFileFromZip(
  zipStream: ZipStream,
  targetFileName: string
): Promise<Buffer> {
  try {
    const fileSize = zipStream.size;

    // Find the end of central directory record (reusing the helper function)
    const endOfCentralDirData = await findEndOfCentralDirectory(zipStream, fileSize);

    // Extract central directory information (reusing the helper function)
    const { centralDirOffset, centralDirSize, entriesCount } = readCentralDirectoryInfo(
      endOfCentralDirData.chunk,
      endOfCentralDirData.offset
    );

    // Read the central directory
    await zipStream.seek(centralDirOffset);
    const centralDirData = await zipStream.read(centralDirSize);

    // Find the specific file entry in the central directory
    const fileEntry = findFileEntryInCentralDirectory(centralDirData, entriesCount, targetFileName);

    if (!fileEntry) {
      throw new Error(`File not found in archive: ${targetFileName}`);
    }

    // Read and extract the file data
    const fileData = await extractFileData(zipStream, fileEntry);

    return fileData;
  } catch (error) {
    logger.error('Failed to extract file from ZIP:', error);
    throw error;
  }
}

/**
 * Extracts all files from a specified directory within a ZIP archive.
 *
 * @param zipStream - Stream interface to access the ZIP file
 * @param directoryPath - Path of the directory to extract (e.g. "folder/subfolder/")
 * @returns Promise resolving to a Map where keys are file paths and values are file contents
 */
export async function extractDirectoryFromZip(
  toc: string[],
  zipStream: ZipStream,
  directoryPath: string,
  ignoredFileTypes: string[] = [],
  acceptedFileTypes?: string[]
): Promise<Map<string, Buffer>> {
  try {
    // Get all file names from the ZIP
    const allFiles = toc;

    let dirFiles: string[];

    // Handle root directory (empty or "/")
    if (directoryPath === "" || directoryPath === "/") {
      // Only include files at the root level (no directory separators)
      dirFiles = allFiles.filter(filePath =>
        // File is at root if it has no directory separator
        // or if the only separator is at the end (directory marker)
        !filePath.includes('/') ||
        (filePath.indexOf('/') === filePath.length - 1)
      );

    } else {
      // For non-root directories, normalize path with trailing slash
      const normalizedDirPath = directoryPath.endsWith('/')
        ? directoryPath
        : `${directoryPath}/`;

      // Get files directly in this directory (one level only)
      dirFiles = allFiles.filter(filePath => {
        // Skip the directory itself
        if (filePath === normalizedDirPath) return false;

        // Must start with the directory path
        if (!filePath.startsWith(normalizedDirPath)) return false;

        // Get the relative path (part after the directory path)
        const relativePath = filePath.substring(normalizedDirPath.length);

        // No subdirectories allowed - should have no slashes in the relative path
        return !relativePath.includes('/');
      });
    }

    if (dirFiles.length === 0) {
      throw new Error(`Directory not found or empty: ${directoryPath}`);
    }

    // Extract each file in the directory
    const extractedFiles = new Map<string, Buffer>();

    for (const filePath of dirFiles) {
      try {
        // Skip directory entries
        if (filePath.endsWith('/')) continue;
        let shouldExtract = true;

        // Let's not get content of the ignored file types
        if (ignoredFileTypes.includes(filePath.split('.').pop() || '')) shouldExtract = false;
        // If acceptedFileTypes is provided, ONLY extract files with extensions in that list
        if (acceptedFileTypes) {
          const fileExt = filePath.split('.').pop() || '';
          shouldExtract = acceptedFileTypes.includes(fileExt);
        }

        if (!shouldExtract) continue;

        /*
         * It's good to think that as we are using the seek approach, we can get the whole directory
         * at once in the buffer, but zip files doesn't store files consecutively, so we need to extract
         * each file individually.
        */
        const fileContent = await extractFileFromZip(zipStream, filePath);
        extractedFiles.set(filePath, fileContent);
      } catch (fileError) {
        logger.warn(`Failed to extract file ${filePath}:`, fileError);
      }
    }

    return extractedFiles;
  } catch (error) {
    logger.error('Failed to extract directory from ZIP:', error);
    throw error;
  }
}

// ======================= ZIP FORMAT PARSING HELPERS ======================= //

/**
 * Locates the End of Central Directory record in a ZIP file.
 *
 * The EOCD is located at the end of the ZIP file and contains pointers
 * to the Central Directory, which holds metadata about all files in the archive.
 *
 * @param zipStream - Stream interface to access the ZIP file
 * @param fileSize - Total size of the ZIP file in bytes
 * @returns Object containing the chunk of data with the EOCD and its offset within that chunk
 */
async function findEndOfCentralDirectory(zipStream: ZipStream, fileSize: number): Promise<{ chunk: Buffer, offset: number }> {
  // The "end of central directory record" is at the end of the file
  // We need to find it by reading backwards from the end
  const maxCommentLength = 65535; // Maximum length of ZIP file comment
  const maxEndOfCentralDirSearchSize = Math.min(fileSize, maxCommentLength + 22); // 22 is the size of the EOCD record

  // Read the last chunk of the file that might contain the EOCD record
  await zipStream.seek(fileSize - maxEndOfCentralDirSearchSize);
  const endChunk = await zipStream.read(maxEndOfCentralDirSearchSize);

  // Search for the end of central directory signature (0x06054b50)
  // Note: In little-endian format, this appears as 50 4B 05 06 in the file
  let endOfCentralDirOffset = -1;
  for (let i = endChunk.length - 22; i >= 0; i--) {
    if (endChunk[i] === 0x50 && endChunk[i + 1] === 0x4b &&
      endChunk[i + 2] === 0x05 && endChunk[i + 3] === 0x06) {
      endOfCentralDirOffset = i;
      break;
    }
  }

  if (endOfCentralDirOffset === -1) {
    throw new Error("Could not find end of central directory record");
  }

  return { chunk: endChunk, offset: endOfCentralDirOffset };
}

/**
 * Extracts information about the Central Directory from the EOCD record.
 *
 * @param chunk - Buffer containing the End of Central Directory record
 * @param offset - Offset within the buffer where the EOCD record starts
 * @returns Object containing central directory offset, size, and number of entries
 */
function readCentralDirectoryInfo(chunk: Buffer, offset: number): { centralDirOffset: number, centralDirSize: number, entriesCount: number } {
  // Extract information about the central directory from the EOCD record
  const centralDirOffset = chunk.readUInt32LE(offset + 16);
  const centralDirSize = chunk.readUInt32LE(offset + 12);
  const entriesCount = chunk.readUInt16LE(offset + 10);

  return { centralDirOffset, centralDirSize, entriesCount };
}

/**
 * Parses all file entries from the Central Directory data.
 * Automatically adds missing root wrapper directory entries if detected.
 *
 * @param centralDirData - Buffer containing the Central Directory data
 * @param entriesCount - Number of entries to parse
 * @returns Array of filenames found in the ZIP, with missing root directories added
 */
function parseCentralDirectoryEntries(centralDirData: Buffer, entriesCount: number): string[] {
  const entries: string[] = [];
  let pos = 0;

  // First pass: extract all original entries
  for (let i = 0; i < entriesCount; i++) {
    // Check central directory header signature (0x02014b50)
    if (centralDirData[pos] !== 0x50 || centralDirData[pos + 1] !== 0x4b ||
      centralDirData[pos + 2] !== 0x01 || centralDirData[pos + 3] !== 0x02) {
      throw new Error(`Invalid central directory header signature at ${pos}`);
    }

    // Read file name length
    const fileNameLength = centralDirData.readUInt16LE(pos + 28);

    // Read extra field length
    const extraFieldLength = centralDirData.readUInt16LE(pos + 30);

    // Read file comment length
    const fileCommentLength = centralDirData.readUInt16LE(pos + 32);

    // Read file name
    const fileName = centralDirData.toString('utf8', pos + 46, pos + 46 + fileNameLength);
    entries.push(fileName);

    // Move to next entry
    pos += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  /*
   * There is a case where each of your file will be wrapped inside a directory path a/
   * and that will be used as an extractor path from toc, in reality that a/ doesn't exist
   * as directory but it's still a path accessor, for resolution of that case we will need to
   * add the root wrapper directory entry to the entries
  */
  const enhancedEntries = addMissingRootWrapperDirectories(entries);
  return enhancedEntries;
}

/**
 * Analyzes entries and adds missing root wrapper directory entries
 */
function addMissingRootWrapperDirectories(entries: string[]): string[] {
  // Separate files and directories
  const fileEntries = entries.filter(entry => !entry.endsWith('/'));
  const dirEntries = new Set(entries.filter(entry => entry.endsWith('/')));

  if (fileEntries.length === 0) {
    return entries; // No files, nothing to analyze
  }

  // Find all unique top-level directories from file paths
  const topLevelDirs = new Set<string>();
  const rootLevelFiles = new Set<string>();

  for (const filePath of fileEntries) {
    const firstSlashIndex = filePath.indexOf('/');
    if (firstSlashIndex === -1) {
      // File is at root level
      rootLevelFiles.add(filePath);
    } else {
      // File is in a directory
      const topLevelDir = filePath.substring(0, firstSlashIndex);
      topLevelDirs.add(topLevelDir);
    }
  }

  // Check for root wrapper pattern: all files in a single top-level directory
  const hasRootWrapper = topLevelDirs.size === 1 && rootLevelFiles.size === 0;

  if (!hasRootWrapper) {
    return entries; // No root wrapper detected
  }

  const rootWrapperName = Array.from(topLevelDirs)[0];
  const rootWrapperEntry = `${rootWrapperName}/`;

  // Check if the root wrapper directory entry is missing
  if (!dirEntries.has(rootWrapperEntry)) {
    logger.info(`Detected missing root wrapper directory: ${rootWrapperEntry}, adding it to entries`);

    // Add the missing directory entry at the beginning
    // This ensures it appears first when building file trees
    return [rootWrapperEntry, ...entries];
  }

  return entries; // Root wrapper directory already exists
}

/**
 * Represents a file entry in the ZIP central directory
 */
interface ZipFileEntry {
  localHeaderOffset: number;
  compressedSize: number;
  compressionMethod: number;
}

/**
 * Finds a specific file entry in the central directory by its name.
 *
 * @param centralDirData - Buffer containing the central directory data
 * @param entriesCount - Number of entries in the central directory
 * @param targetFileName - Name of the file to find
 * @returns File entry information or null if not found
 */
function findFileEntryInCentralDirectory(
  centralDirData: Buffer,
  entriesCount: number,
  targetFileName: string
): ZipFileEntry | null {
  let pos = 0;

  for (let i = 0; i < entriesCount; i++) {
    // Check signature (0x02014b50)
    if (centralDirData[pos] !== 0x50 || centralDirData[pos + 1] !== 0x4b ||
      centralDirData[pos + 2] !== 0x01 || centralDirData[pos + 3] !== 0x02) {
      throw new Error(`Invalid central directory header signature at ${pos}`);
    }

    // Read key information
    const compressionMethod = centralDirData.readUInt16LE(pos + 10);
    const compressedSize = centralDirData.readUInt32LE(pos + 20);
    const fileNameLength = centralDirData.readUInt16LE(pos + 28);
    const extraFieldLength = centralDirData.readUInt16LE(pos + 30);
    const fileCommentLength = centralDirData.readUInt16LE(pos + 32);
    const localHeaderOffset = centralDirData.readUInt32LE(pos + 42);

    // Read the file name
    const fileName = centralDirData.toString('utf8', pos + 46, pos + 46 + fileNameLength);

    // Check if this is the file we're looking for
    if (fileName === targetFileName) {
      return {
        localHeaderOffset,
        compressedSize,
        compressionMethod
      };
    }

    // Move to the next entry
    pos += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  return null;
}

/**
 * Extracts file data from the ZIP archive based on a file entry.
 * Handles decompression if the file is compressed.
 *
 * @param zipStream - Stream interface to access the ZIP file
 * @param fileEntry - Information about the file to extract
 * @returns Promise resolving to a Buffer containing the file contents
 */
async function extractFileData(zipStream: ZipStream, fileEntry: ZipFileEntry): Promise<Buffer> {
  // Read the local file header
  await zipStream.seek(fileEntry.localHeaderOffset);
  const headerData = await zipStream.read(30); // Local file header is at least 30 bytes

  // Verify signature (0x04034b50)
  if (headerData[0] !== 0x50 || headerData[1] !== 0x4b ||
    headerData[2] !== 0x03 || headerData[3] !== 0x04) {
    throw new Error("Invalid local file header signature");
  }

  const localFileNameLength = headerData.readUInt16LE(26);
  const localExtraFieldLength = headerData.readUInt16LE(28);

  // File data starts after the header, filename, and extra field
  const fileDataOffset = fileEntry.localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;

  // Read the file data
  await zipStream.seek(fileDataOffset);
  const compressedData = await zipStream.read(fileEntry.compressedSize);

  // Handle decompression based on the compression method
  return decompressData(compressedData, fileEntry.compressionMethod);
}

/**
 * Decompresses data based on the compression method used.
 *
 * @param compressedData - The compressed file data
 * @param compressionMethod - The compression method (0 = no compression, 8 = DEFLATE)
 * @returns Promise resolving to the decompressed data
 */
async function decompressData(compressedData: Buffer, compressionMethod: number): Promise<Buffer> {
  // If not compressed, just return the data
  if (compressionMethod === 0) {
    return compressedData;
  }

  // For method 8 (DEFLATE), use zlib
  if (compressionMethod === 8) {
    return new Promise((resolve, reject) => {
      zlib.inflateRaw(compressedData, (err: Error | null, result: Buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  throw new Error(`Unsupported compression method: ${compressionMethod}`);
}
