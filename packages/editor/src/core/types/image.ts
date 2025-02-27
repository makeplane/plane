export type DeleteImage = (assetUrlWithWorkspaceId: string) => Promise<void>;

export type RestoreImage = (assetUrlWithWorkspaceId: string) => Promise<void>;

export type UploadImage = (blockId: string, file: File) => Promise<string>;
