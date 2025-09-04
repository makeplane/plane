import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { ContentParser, IParserExtension } from "@plane/etl/parser";
import {
  NotionBlockColorParserExtension,
  NotionHighlightParserExtension,
} from "../../../common/content-parser/extensions/process-colors";
import { NotionImageParserExtension } from "../../../common/content-parser/extensions/process-images";
import { ProcessLinksExtension } from "../../../common/content-parser/extensions/process-links";
import {
  ConfluenceExtractBodyExtension,
  ConfluenceTaskListParserExtension,
  ConfluenceIconParserExtension,
  ConfluencePageParserExtension,
  ConfluenceStatusMacroParserExtension,
  ConfluenceColorIdParserExtension,
  ConfluenceBackgroundColorParserExtension,
  ConfluenceFileParserExtension,
  ConfluenceCalloutParserExtension,
  PTagCustomComponentExtension,
} from "../extensions";

// Mock Plane Client - only includes the functions actually used by extensions
const createMockPlaneClient = () => ({
  assets: {
    uploadAsset: jest.fn().mockResolvedValue(mockUUID),
  },
});

const mockUUID = "8d232791-7e07-4021-8aa2-bcd24c3a691b";

// Helper function to read HTML files
const readHtmlFile = (filename: string): string => {
  const filePath = join(__dirname, "assets", filename);
  return readFileSync(filePath, "utf-8");
};

// Helper function to create SHA-256 hash of content
const createHash256 = (content: string): string => createHash("sha256").update(content.trim()).digest("hex");

describe("ContentParser", () => {
  it("should process Confluence HTML sample", async () => {
    const context = new Map<string, any>();
    const mockPlaneClient = createMockPlaneClient();

    // Set up asset maps for testing
    const assetMap = new Map([
      ["attachments/14155777/14057474.jpg", mockUUID],
      ["attachments/14155777/16515074.jpg", mockUUID],
      ["attachments/14155777/14319622.png", mockUUID],
      ["attachments/14155777/14385154.keylayout", mockUUID],
    ]);

    const pageMap = new Map();

    const config = {
      assetMap,
      pageMap,
      fileId: uuidv4(),
      workspaceSlug: "sandbox",
      apiBaseUrl: "https://api.test.com",
      planeClient: mockPlaneClient,
      context,
    };

    const preprocessExtensions: IParserExtension[] = [
      new ConfluenceExtractBodyExtension({ selector: "div#main-content", context }),
      new ConfluenceTaskListParserExtension(),
      new ConfluenceIconParserExtension(),
      new ConfluencePageParserExtension(config),
    ];

    /*----------- Core Extensions -----------*/
    const coreExtensions: IParserExtension[] = [
      new ProcessLinksExtension(),
      new ConfluenceStatusMacroParserExtension(),
      new ConfluenceColorIdParserExtension(context),
      new ConfluenceBackgroundColorParserExtension(),
      new NotionImageParserExtension(config),
      new ConfluenceFileParserExtension({
        ...config,
        context,
        uuidGenerator: () => mockUUID,
      }),
      new NotionBlockColorParserExtension(),
      new NotionHighlightParserExtension(),
    ];

    const postprocessExtensions: IParserExtension[] = [
      new ConfluenceCalloutParserExtension(),
      new PTagCustomComponentExtension(),
    ];

    const contentParser = new ContentParser(coreExtensions, preprocessExtensions, postprocessExtensions);

    // Read the Confluence HTML sample
    const confluenceHtml = readHtmlFile("confluence-sample.html");

    // Process the Confluence HTML through the parser
    const result = await contentParser.toPlaneHtml(confluenceHtml);

    // Read the expected parsed sample
    const expectedParsedHtml = readHtmlFile("parsed-sample.html");

    // Create hashes for comparison
    const resultHash = createHash256(result);
    const expectedHash = createHash256(expectedParsedHtml);

    console.log("Result hash:", resultHash);
    console.log("Expected hash:", expectedHash);

    // Just verify that the parser processes the HTML without throwing errors
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);

    // Compare hashes to verify the result matches expected output
    expect(resultHash).toBe(expectedHash);
  });
});
