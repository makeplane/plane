export type TMediaItem = {
  id: string;
  packageId?: string;
  title: string;
  description?: string;
  format: string;
  linkedFormat?: string;
  action: string;
  link?: string | null;
  author: string;
  createdAt: string;
  views: number;
  duration: string;
  primaryTag: string;
  secondaryTag: string;
  itemsCount: number;
  meta: Record<string, unknown>;
  mediaType: "video" | "image" | "document";
  linkedMediaType?: "video" | "image" | "document";
  thumbnail: string;
  videoSrc?: string;
  imageSrc?: string;
  fileSrc?: string;
  downloadSrc?: string;
  docs: string[];
};

export type TMediaSection = {
  title: string;
  items: TMediaItem[];
};
