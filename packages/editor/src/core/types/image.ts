export type DeleteImage = (assetUrlWithWorkspaceId: string) => Promise<any>;

export type RestoreImage = (assetUrlWithWorkspaceId: string) => Promise<any>;

export type UploadImage = (file: File) => Promise<string>;
