export interface IframelyResponse {
  error?: string;
  code?: string;
  html?: string;
  meta?: {
    title?: string;
    description?: string;
    medium?: string;
    keywords?: string;
    canonical?: string;
    site: string;
  };
  links?: {
    thumbnail?: Array<{
      href: string;
      type: string;
      rel: string[];
      media?: {
        width: number;
        height: number;
      };
    }>;
    icon?: Array<{
      href: string;
      rel: string[];
      type: string;
      media?: {
        width: number;
        height: number;
      };
    }>;
  };
  rel?: string[];
}

export interface IframelyError {
  message: string;
  code: number;
  source: string;
}
