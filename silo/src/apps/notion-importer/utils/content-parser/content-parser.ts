import { ContentParser, IParserExtension } from "@plane/etl/parser";
import { TNotionContentParserConfig } from "../../types";
import {
  ExtractBodyExtension,
  NotionFileParserExtension,
  NotionImageParserExtension,
  NotionPageParserExtension,
  ProcessLinksExtension,
  NotionBlockColorParserExtension,
  NotionHighlightParserExtension,
} from "./extensions";

export const getContentParser = (config: TNotionContentParserConfig) => {
  /*----------- Preprocess Extensions -----------*/
  const preprocessExtensions: IParserExtension[] = [new ExtractBodyExtension()];

  /*----------- Core Extensions -----------*/
  const coreExtensions: IParserExtension[] = [
    new ProcessLinksExtension(),
    new NotionImageParserExtension(config),
    new NotionFileParserExtension(config),
    new NotionPageParserExtension(config),
    new NotionBlockColorParserExtension(),
    new NotionHighlightParserExtension(),
  ];

  return new ContentParser(coreExtensions, preprocessExtensions, []);
};
