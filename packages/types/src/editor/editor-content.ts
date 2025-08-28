/**
 * Editor content types - locally defined to avoid external dependencies
 */

export type JSONContent = {
  type?: string;
  attrs?: Record<string, any>;
  content?: JSONContent[];
  marks?: {
    type: string;
    attrs?: Record<string, any>;
    [key: string]: any;
  }[];
  text?: string;
  [key: string]: any;
};

export type HTMLContent = string;

export type Content = HTMLContent | JSONContent | JSONContent[] | null;
