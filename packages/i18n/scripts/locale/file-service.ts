// fileService.ts
import { promises as fs } from "fs";

export class FileService {
  /**
   * Reads the content of a file at the specified path
   * @param filePath Path to the file to read
   * @returns The file content as a string, or null if the file doesn't exist or can't be read
   * @throws Never - returns null instead of throwing
   */
  async read(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch {
      return null;
    }
  }

  /**
   * Writes content to a file at the specified path
   * @param filePath Path to the file to write
   * @param content Content to write to the file
   * @throws If the file can't be written to (e.g., permissions, disk space)
   */
  async write(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, "utf-8");
  }

  /**
   * Checks if a file exists at the specified path
   * @param filePath Path to check for file existence
   * @returns True if the file exists and is accessible, false otherwise
   * @throws Never - returns false instead of throwing
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
