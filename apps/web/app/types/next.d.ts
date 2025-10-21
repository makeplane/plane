declare module "next" {
  // Minimal shim for next module exports
  export interface Metadata {
    title?: string;
    description?: string;
    [key: string]: any;
  }
}
