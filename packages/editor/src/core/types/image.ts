export type DeleteImage = (assetUrlWithWorkspaceId: string) => Promise<void>;

export type RestoreImage = (assetUrlWithWorkspaceId: string) => Promise<void>;

export type UploadImage = (file: File) => Promise<string>;
