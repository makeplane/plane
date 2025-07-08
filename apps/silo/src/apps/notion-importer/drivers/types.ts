import { ContentParser } from "@plane/etl/parser";
import { TZipFileNode } from "@/lib/zip-manager";
import { TDocContentParserConfig } from "../types";

/*
 * The entire process of importing for zip files is exactly the same
 * when comes to the html zip exports, something that changes and is
 * provider specific is how the file tree looks like and how the content
 * needs to be parsed. Apart from that if we provide a root node with
 * children which represent a parent child relationship in as nested
 * components, we can make the entire process generic.
 * A driver itself is this provider specific implementation, which acts
 * as a contract between the main import process and provider specific
 * implementation.
*/
export interface IZipImportDriver {
  /*
   * Make use of the zip manager and build the file tree,
   * The implementation can be solely provider specific, but
   * usually we need to rely on the table of contents provided
   * by the zip manager to build the file tree.
  */
  buildFileTree(): Promise<TZipFileNode | undefined>;
  /*
   * The content parser is the one that is responsible for parsing the
   * content of the document, it is the one that is responsible for
   * converting the content to the plane html format.
  */
  getContentParser(config: TDocContentParserConfig): ContentParser;
}
