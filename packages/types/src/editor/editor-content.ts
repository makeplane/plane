/**
 * Editor content types - locally defined to avoid external dependencies
 */

export type JSONContent = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
  marks?: {
    type: string;
    attrs?: Record<string, unknown>;
    [key: string]: unknown;
  }[];
  text?: string;
  [key: string]: unknown;
};

export type HTMLContent = string;

export type Content = HTMLContent | JSONContent | JSONContent[] | null;
